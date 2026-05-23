import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseClient } from '../../lib/supabase-server';
import { requireAuth } from '../../lib/auth';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';
import { isDemoMode } from '../../lib/demo-mode';
import { demoModels } from '../../lib/demo-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // Require authentication for models access
  const auth = await requireAuth(req, res);
  if (!auth) return; // Response already sent by requireAuth

  if (isDemoMode) {
    res.status(200).json(demoModels);
    return;
  }

  // Extract auth token and create authenticated Supabase client
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || authHeader;
  const supabase = createSupabaseClient(token);

  try {
    // Query the models table for all active models with specific fields
    const { data, error } = await supabase
      .from('models')
      .select('id, name, provider, version, max_tokens, cost_input_per_million, cost_output_per_million')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json(data || []);
  } catch (error: any) {
    console.error('API Models Error:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
