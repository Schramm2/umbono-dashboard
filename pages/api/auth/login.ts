import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';
import { demoAuthToken, isDemoMode } from '../../../lib/demo-mode';
import { demoProfile, demoUser } from '../../../lib/demo-data';

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
      return res.status(200).json({
        user: demoUser,
        profile: demoProfile,
        session: {
          access_token: demoAuthToken,
          refresh_token: 'demo-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        message: 'Demo login successful',
        simulated: true,
      });
    }

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
