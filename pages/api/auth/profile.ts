import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, getUserProfile, requireRole } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';

// Helper function to get user settings
async function getUserSettings(userId: string) {
  const { data: settings, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is okay - we'll create defaults
    console.error('Error fetching user settings:', error);
  }

  return settings;
}

// Helper function to ensure user settings exist
async function ensureUserSettings(userId: string) {
  const existing = await getUserSettings(userId);
  if (existing) {
    return existing;
  }

  // Create default settings if they don't exist
  const { data: newSettings, error } = await supabaseAdmin
    .from('user_settings')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create user settings: ${error.message}`);
  }

  return newSettings;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  // GET: Fetch user profile and settings
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    try {
      const profile = await getUserProfile(auth.user.id);
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Get or create user settings
      const settings = await ensureUserSettings(auth.user.id);

      return res.status(200).json({
        profile,
        settings
      });
    } catch (error: any) {
      console.error('API Auth Profile Get Error:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  // PUT: Update user profile and/or settings
  if (req.method === 'PUT') {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    try {
      const { profile: profileUpdates, settings: settingsUpdates } = req.body;

      const result: any = {};

      // Update profile if provided
      if (profileUpdates) {
        const { full_name, role } = profileUpdates;

        // Only admins can change roles
        const currentProfile = await getUserProfile(auth.user.id);
        if (role && role !== currentProfile?.role) {
          const { profile: adminProfile } = await requireRole(req, res, ['admin']);
          if (!adminProfile) return; // Response already sent
        }

        const updateData: any = {};
        if (full_name !== undefined) {
          updateData.full_name = full_name;
        }
        if (role !== undefined && currentProfile?.role === 'admin') {
          updateData.role = role;
        }

        if (Object.keys(updateData).length > 0) {
          const { data: updatedProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', auth.user.id)
            .select('*')
            .single();

          if (profileError) {
            throw new Error(`Failed to update profile: ${profileError.message}`);
          }

          result.profile = updatedProfile;
        } else {
          result.profile = currentProfile;
        }
      }

      // Update settings if provided
      if (settingsUpdates) {
        // Ensure settings exist first
        await ensureUserSettings(auth.user.id);

        // Build update object with only provided fields
        const updateData: any = {};

        // Appearance & UI Settings
        if (settingsUpdates.theme_preference !== undefined) {
          updateData.theme_preference = settingsUpdates.theme_preference;
        }
        if (settingsUpdates.font_size !== undefined) {
          updateData.font_size = settingsUpdates.font_size;
        }
        if (settingsUpdates.compact_mode !== undefined) {
          updateData.compact_mode = settingsUpdates.compact_mode;
        }
        if (settingsUpdates.show_tooltips !== undefined) {
          updateData.show_tooltips = settingsUpdates.show_tooltips;
        }
        if (settingsUpdates.show_hints !== undefined) {
          updateData.show_hints = settingsUpdates.show_hints;
        }

        // Model & Evaluation Settings
        if (settingsUpdates.default_temperature !== undefined) {
          updateData.default_temperature = settingsUpdates.default_temperature;
        }
        if (settingsUpdates.default_top_p !== undefined) {
          updateData.default_top_p = settingsUpdates.default_top_p;
        }
        if (settingsUpdates.default_max_tokens !== undefined) {
          updateData.default_max_tokens = settingsUpdates.default_max_tokens;
        }
        if (settingsUpdates.default_selected_models !== undefined) {
          updateData.default_selected_models = settingsUpdates.default_selected_models;
        }
        if (settingsUpdates.evaluation_weights !== undefined) {
          updateData.evaluation_weights = settingsUpdates.evaluation_weights;
        }

        // Workflow & Behavior Settings
        if (settingsUpdates.keyboard_shortcuts_enabled !== undefined) {
          updateData.keyboard_shortcuts_enabled = settingsUpdates.keyboard_shortcuts_enabled;
        }
        if (settingsUpdates.auto_save_prompts !== undefined) {
          updateData.auto_save_prompts = settingsUpdates.auto_save_prompts;
        }
        if (settingsUpdates.default_template !== undefined) {
          updateData.default_template = settingsUpdates.default_template;
        }

        // Prompt Editor Settings
        if (settingsUpdates.prompt_max_length !== undefined) {
          updateData.prompt_max_length = settingsUpdates.prompt_max_length;
        }
        if (settingsUpdates.prompt_word_wrap !== undefined) {
          updateData.prompt_word_wrap = settingsUpdates.prompt_word_wrap;
        }
        if (settingsUpdates.prompt_line_numbers !== undefined) {
          updateData.prompt_line_numbers = settingsUpdates.prompt_line_numbers;
        }
        if (settingsUpdates.prompt_font_family !== undefined) {
          updateData.prompt_font_family = settingsUpdates.prompt_font_family;
        }

        // Notifications & Alerts
        if (settingsUpdates.toast_notifications_enabled !== undefined) {
          updateData.toast_notifications_enabled = settingsUpdates.toast_notifications_enabled;
        }
        if (settingsUpdates.sound_effects_enabled !== undefined) {
          updateData.sound_effects_enabled = settingsUpdates.sound_effects_enabled;
        }
        if (settingsUpdates.email_notifications_enabled !== undefined) {
          updateData.email_notifications_enabled = settingsUpdates.email_notifications_enabled;
        }
        if (settingsUpdates.email_on_evaluation_complete !== undefined) {
          updateData.email_on_evaluation_complete = settingsUpdates.email_on_evaluation_complete;
        }
        if (settingsUpdates.email_on_run_complete !== undefined) {
          updateData.email_on_run_complete = settingsUpdates.email_on_run_complete;
        }

        // Data & Privacy
        if (settingsUpdates.data_sharing_enabled !== undefined) {
          updateData.data_sharing_enabled = settingsUpdates.data_sharing_enabled;
        }

        if (Object.keys(updateData).length > 0) {
          const { data: updatedSettings, error: settingsError } = await supabaseAdmin
            .from('user_settings')
            .update(updateData)
            .eq('user_id', auth.user.id)
            .select('*')
            .single();

          if (settingsError) {
            throw new Error(`Failed to update settings: ${settingsError.message}`);
          }

          result.settings = updatedSettings;
        } else {
          result.settings = await getUserSettings(auth.user.id);
        }
      }

      // If no updates were provided, return current data
      if (!profileUpdates && !settingsUpdates) {
        const profile = await getUserProfile(auth.user.id);
        const settings = await ensureUserSettings(auth.user.id);
        return res.status(200).json({ profile, settings });
      }

      // Fetch updated data if not already in result
      if (!result.profile) {
        result.profile = await getUserProfile(auth.user.id);
      }
      if (!result.settings) {
        result.settings = await getUserSettings(auth.user.id);
      }

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('API Auth Profile Update Error:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
