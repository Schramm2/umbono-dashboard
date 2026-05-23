import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';
import { demoAuthToken, isDemoMode } from '../../../lib/demo-mode';
import { demoProfile, demoUser } from '../../../lib/demo-data';

// Create a public client for user registration (uses anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.local';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (isDemoMode) {
      return res.status(201).json({
        user: demoUser,
        profile: demoProfile,
        session: {
          access_token: demoAuthToken,
          refresh_token: 'demo-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        message: 'Demo registration simulated',
        simulated: true,
      });
    }

    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Use admin API to create user with email_confirm: true
    // This completely bypasses email confirmation - user can login immediately
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email - no confirmation step needed
      user_metadata: {
        full_name: full_name || ''
      }
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      // Check for specific error types
      if (authError.message?.includes('API key') || authError.message?.includes('Invalid')) {
        return res.status(500).json({ 
          message: 'Server configuration error: Invalid API key. Please check SUPABASE_SERVICE_ROLE_KEY in .env.local',
          error: authError.message 
        });
      }
      // Handle user already exists
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists') || authError.message?.includes('User already registered')) {
        return res.status(409).json({ 
          message: 'User with this email already exists',
          error: authError.message 
        });
      }
      return res.status(400).json({ 
        message: authError.message || 'Failed to create user',
        error: authError.message 
      });
    }

    if (!authData.user) {
      return res.status(400).json({ 
        message: 'Failed to create user - no user data returned' 
      });
    }

    // Create a session for the user so they can login immediately
    // Since email is already confirmed, sign them in to get a session
    let session = null;
    try {
      const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
        email,
        password,
      });
      if (signInData?.session && !signInError) {
        session = signInData.session;
      }
    } catch (sessionErr: any) {
      console.error('Session creation error (non-critical):', sessionErr.message);
      // User can still login manually - this is non-critical
    }

    // Profile is automatically created by trigger, but let's verify it exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which shouldn't happen due to trigger
      console.error('Profile creation error:', profileError);
    }

    // Return user data (without sensitive info)
    // Include session if available (user can login immediately)
    return res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      profile: profile || null,
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      } : null,
      message: 'User registered successfully - email confirmation bypassed, you can login immediately'
    });
  } catch (error: any) {
    console.error('API Auth Register Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
