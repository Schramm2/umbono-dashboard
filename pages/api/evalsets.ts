import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Query eval_sets with prompt count from eval_set_prompts
    const { data: evalSets, error } = await supabase
      .from('eval_sets')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        eval_set_prompts (
          id,
          prompt_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Transform the data to include prompt count
    const evalSetsWithCounts = (evalSets || []).map((evalSet: any) => {
      const promptCount = Array.isArray(evalSet.eval_set_prompts)
        ? evalSet.eval_set_prompts.length
        : 0;

      return {
        id: evalSet.id,
        name: evalSet.name,
        description: evalSet.description,
        promptCount: promptCount,
        created_at: evalSet.created_at,
        updated_at: evalSet.updated_at,
      };
    });

    return res.status(200).json(evalSetsWithCounts);
  } catch (error: any) {
    console.error('API EvalSets Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

