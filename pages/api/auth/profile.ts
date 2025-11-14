import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, getUserProfile, requireRole } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { setCorsHeaders, handleCorsPreflight } from '../../../lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req, res);
  if (preflightResponse) return preflightResponse;

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  // GET: Fetch user profile
  if (req.method === 'GET') {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    try {
      const profile = await getUserProfile(auth.user.id);
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      return res.status(200).json(profile);
    } catch (error: any) {
      console.error('API Auth Profile Get Error:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  // PUT: Update user profile
  if (req.method === 'PUT') {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    try {
      const { full_name, role } = req.body;

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

      const { data: updatedProfile, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', auth.user.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return res.status(200).json(updatedProfile);
    } catch (error: any) {
      console.error('API Auth Profile Update Error:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

