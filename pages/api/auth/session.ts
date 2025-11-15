import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser, getUserProfile } from '../../../lib/auth';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const profile = await getUserProfile(user.id);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
      authenticated: true
    });
  } catch (error: any) {
    console.error('API Auth Session Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

