/**
 * @file lib/auth.ts
 * @description Authentication middleware and utility layer for Umbono.
 * Supports dual-mode authentication:
 * 1. DEMO_MODE: Bypasses external checks, returning deterministic mock users and settings.
 * 2. PRODUCTION_MODE: Validates Supabase JWTs, extracts authenticated user sessions,
 *    and enforces role-based access control (RBAC).
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from './supabase-server';
import { isDemoMode } from './demo-mode';
import { demoProfile, demoUser } from './demo-data';

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin' | 'viewer';
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  
  // Appearance & UI Settings
  theme_preference?: 'light' | 'dark' | 'system';
  font_size?: 'small' | 'medium' | 'large' | 'xlarge';
  compact_mode?: boolean;
  show_tooltips?: boolean;
  show_hints?: boolean;
  
  // Model & Evaluation Settings
  default_temperature?: number;
  default_top_p?: number;
  default_max_tokens?: number;
  default_selected_models?: string[]; // Array of model IDs
  evaluation_weights?: {
    clarity?: number;
    helpfulness?: number;
    creativity?: number;
    ubuntu_alignment?: number;
  };
  
  // Workflow & Behavior Settings
  keyboard_shortcuts_enabled?: boolean;
  auto_save_prompts?: boolean;
  default_template?: string;
  
  // Prompt Editor Settings
  prompt_max_length?: number;
  prompt_word_wrap?: boolean;
  prompt_line_numbers?: boolean;
  prompt_font_family?: string;
  
  // Notifications & Alerts
  toast_notifications_enabled?: boolean;
  sound_effects_enabled?: boolean;
  email_notifications_enabled?: boolean;
  email_on_evaluation_complete?: boolean;
  email_on_run_complete?: boolean;
  
  // Data & Privacy
  data_sharing_enabled?: boolean;
  
  created_at?: string;
  updated_at?: string;
}

/**
 * Extract and verify auth token from request headers
 */
export async function getAuthUser(req: NextApiRequest): Promise<AuthUser | null> {
  if (isDemoMode) {
    return demoUser;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || authHeader;
  
  if (!token) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication for an API route
 * Returns user if authenticated, otherwise sends 401 response
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: AuthUser } | null> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized - Authentication required' });
    return null;
  }
  return { user };
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isDemoMode) {
    return demoProfile as UserProfile;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Require specific role(s) for an API route
 * Returns user and profile if authorized, otherwise sends 403 response
 */
export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  roles: string[]
): Promise<{ user: AuthUser; profile: UserProfile } | null> {
  const authResult = await requireAuth(req, res);
  if (!authResult) {
    return null; // Response already sent
  }

  const profile = await getUserProfile(authResult.user.id);
  if (!profile) {
    res.status(403).json({ message: 'Forbidden - User profile not found' });
    return null;
  }

  if (!roles.includes(profile.role)) {
    res.status(403).json({ 
      message: 'Forbidden - Insufficient permissions',
      required: roles,
      current: profile.role
    });
    return null;
  }

  return { user: authResult.user, profile };
}

/**
 * Require admin role
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ user: AuthUser; profile: UserProfile } | null> {
  return requireRole(req, res, ['admin']);
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, role: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.role === role;
}

/**
 * Get user settings from database
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (isDemoMode) {
    return {
      id: 'demo-settings',
      user_id: demoUser.id,
      theme_preference: 'light',
      font_size: 'medium',
      compact_mode: false,
      show_tooltips: true,
      show_hints: true,
      default_temperature: 0.4,
      default_top_p: 1,
      default_max_tokens: 1200,
      default_selected_models: ['demo-gpt-4o', 'demo-claude-sonnet', 'demo-gemini-flash'],
      evaluation_weights: {
        clarity: 0.3,
        helpfulness: 0.4,
        creativity: 0.2,
        ubuntu_alignment: 0.5,
      },
    };
  }

  const { data: settings, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !settings) {
    return null;
  }

  return settings;
}
