import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req, res);
  if (preflightResponse) return preflightResponse;

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({ 
        message: authError?.message || 'Invalid email or password' 
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Return session token and user data
    return res.status(200).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      profile: profile || null,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('API Auth Login Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

