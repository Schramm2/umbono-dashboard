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
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || authHeader;

    if (!token) {
      return res.status(400).json({ message: 'No authentication token provided' });
    }

    // Sign out the user
    const { error } = await supabaseAdmin.auth.signOut(token);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('API Auth Logout Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

