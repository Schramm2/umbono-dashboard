import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Require authentication
  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'Password is required to delete account' 
      });
    }

    // Verify password before deletion
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: auth.user.email!,
      password: password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ 
        message: 'Password is incorrect' 
      });
    }

    // Delete user account using admin API
    // This will cascade delete profile and settings due to ON DELETE CASCADE
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      auth.user.id
    );

    if (deleteError) {
      console.error('Account deletion error:', deleteError);
      return res.status(500).json({ 
        message: 'Failed to delete account', 
        error: deleteError.message 
      });
    }

    return res.status(200).json({ 
      message: 'Account deleted successfully' 
    });
  } catch (error: any) {
    console.error('API Auth Delete Account Error:', error.message);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

