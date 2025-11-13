import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req, res);
  if (preflightResponse) return preflightResponse;

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    return res.status(200).json(data || []);
  } catch (error: any) {
    console.error('API Models Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

