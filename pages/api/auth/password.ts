import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';
import { isDemoMode } from '../../../lib/demo-mode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Require authentication
  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    if (isDemoMode) {
      return res.status(200).json({
        message: 'Demo password update simulated. No credentials were changed.',
        simulated: true,
      });
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Verify current password by attempting to sign in
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: auth.user.email!,
      password: current_password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      });
    }

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      auth.user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ 
        message: 'Failed to update password', 
        error: updateError.message 
      });
    }

    return res.status(200).json({ 
      message: 'Password updated successfully' 
    });
  } catch (error: any) {
    console.error('API Auth Password Update Error:', error.message);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}
