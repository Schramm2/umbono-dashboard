import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { createSupabaseClient } from '../../../lib/supabase-server';
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

  // Require authentication
  const auth = await requireAuth(req, res);
  if (!auth) return;

  try {
    // Extract auth token and create authenticated Supabase client
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || authHeader;
    const supabase = createSupabaseClient(token);

    const userId = auth.user.id;

    // Export all user-related data
    const exportData: any = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: null,
      settings: null,
      runs: [],
      prompts: [],
      evaluations: [],
    };

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    exportData.profile = profile;

    // Get settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    exportData.settings = settings;

    // Get all runs created by this user
    const { data: runs } = await supabase
      .from('runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    exportData.runs = runs || [];

    // Get all prompts associated with user's runs
    if (runs && runs.length > 0) {
      const promptIds = [...new Set(runs.map((run: any) => run.prompt_id))];
      const { data: prompts } = await supabase
        .from('prompts')
        .select('*')
        .in('id', promptIds);
      exportData.prompts = prompts || [];
    }

    // Get all outputs and ratings for user's runs
    if (runs && runs.length > 0) {
      const runIds = runs.map((run: any) => run.id);
      const { data: outputs } = await supabase
        .from('outputs')
        .select(`
          *,
          ratings (*)
        `)
        .in('run_id', runIds);
      exportData.evaluations = outputs || [];
    }

    // Set response headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="mmped-export-${userId}-${Date.now()}.json"`);

    return res.status(200).json(exportData);
  } catch (error: any) {
    console.error('API Auth Export Data Error:', error.message);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

