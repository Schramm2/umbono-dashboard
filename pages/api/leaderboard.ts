import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseClient } from '../../lib/supabase-server';
import { requireAuth } from '../../lib/auth';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';

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

  // Require authentication for leaderboard access
  const auth = await requireAuth(req, res);
  if (!auth) return; // Response already sent by requireAuth

  // Extract auth token and create authenticated Supabase client
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || authHeader;
  const supabase = createSupabaseClient(token);

  const { dateRange, modelId, tag, taskType, provider, userId } = req.query;
  
  // Determine which user ID to filter by
  // If userId query param is "all" or not provided, don't filter by user (show all users)
  // If userId is "me", filter by the authenticated user's ID
  // Otherwise, use the provided userId to filter
  const filterUserId = userId === 'all' || !userId 
    ? null 
    : userId === 'me' 
      ? auth.user.id 
      : userId as string;

  try {
    // Build base query - join outputs with models, runs, and ratings
    // Filter to only include outputs that have been evaluated (computed_score is not null)
    let query = supabase
      .from('outputs')
      .select(`
        id,
        model_id,
        computed_score,
        latency_ms,
        cost,
        input_tokens,
        output_tokens,
        created_at,
        models (
          id,
          name,
          provider,
          version,
          cost_input_per_million,
          cost_output_per_million,
          updated_at
        ),
        runs (
          id,
          created_at,
          prompt_id,
          user_id
        ),
        ratings (
          id,
          criterion_id,
          value,
          boolean_value
        )
      `)
      .not('computed_score', 'is', null); // Only include outputs that have been rated

    // Apply date range filter (using runs.created_at)
    if (dateRange) {
      const now = new Date();
      let startDate = new Date();

      // Handle both formats: "7", "30", "90" (from frontend) and "Last 7 days", etc.
      const days = dateRange === '7' || dateRange === 'Last 7 days' ? 7 :
                   dateRange === '30' || dateRange === 'Last 30 days' ? 30 :
                   dateRange === '90' || dateRange === 'Last 90 days' ? 90 :
                   dateRange === 'Last year' ? 365 : null;

      if (days) {
        startDate.setDate(now.getDate() - days);
        // Filter by outputs created_at (which should align with runs.created_at)
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    // Apply model ID filter
    if (modelId) {
      query = query.eq('model_id', modelId as string);
    }

    // Apply provider filter (if not "all")
    if (provider && provider !== 'all') {
      // Note: This requires filtering through the models relation
      // We'll filter after fetching since Supabase doesn't easily support filtering on nested relations
    }

    // Tag/taskType filtering - requires joining through eval_set_prompts and eval_sets
    // taskType from frontend maps to tag/eval_set name
    // For MVP, we'll implement a simplified version
    // If tag is provided, we need to filter by eval_set_id
    // This requires a more complex query structure
    let tagFilteredPromptIds: string[] | null = null;
    const evalSetName = (tag || taskType) as string;
    if (evalSetName && evalSetName !== 'all') {
      // First, find the eval_set_id by tag/taskType name
      const { data: evalSet, error: evalSetError } = await supabase
        .from('eval_sets')
        .select('id')
        .eq('name', evalSetName)
        .single();

      if (!evalSetError && evalSet) {
        // Get all prompt_ids associated with this eval_set
        const { data: evalSetPrompts, error: promptsError } = await supabase
          .from('eval_set_prompts')
          .select('prompt_id')
          .eq('eval_set_id', evalSet.id);

        if (!promptsError && evalSetPrompts) {
          tagFilteredPromptIds = evalSetPrompts.map((esp) => esp.prompt_id);
        }
      }
    }

    // Get run IDs that belong to the filtered user
    // This will be used to filter outputs at the query level
    let userFilteredRunIds: string[] | null = null;
    if (filterUserId) {
      const { data: userRuns, error: runsError } = await supabase
        .from('runs')
        .select('id')
        .eq('user_id', filterUserId);

      if (!runsError && userRuns && userRuns.length > 0) {
        userFilteredRunIds = userRuns.map((run) => run.id);
        // Filter outputs query by run IDs belonging to the user
        query = query.in('run_id', userFilteredRunIds);
      } else if (!runsError && userRuns && userRuns.length === 0) {
        // User has no runs, return empty result early
        res.status(200).json([]);
        return;
      }
    }

    const { data: rawData, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!rawData || rawData.length === 0) {
      res.status(200).json([]);
      return;
    }

    // Fetch criteria names for display
    const { data: criteriaNames, error: criteriaNameError } = await supabase
      .from('evaluation_criteria')
      .select('id, name, type');

    if (criteriaNameError) {
      throw new Error(criteriaNameError.message);
    }

    const criteriaMap = new Map(criteriaNames?.map((c) => [c.id, c]) || []);

    // Process raw data into aggregated leaderboard format
    const modelAggregates = new Map<string, any>();

    rawData.forEach((output: any) => {
      // User filter is already applied at query level, but double-check using run user_id if available
      if (filterUserId && output.runs) {
        const runUserId = Array.isArray(output.runs) ? output.runs[0]?.user_id : output.runs?.user_id;
        // Additional safety check: if user_id is available in the run data, verify it matches
        if (runUserId && runUserId !== filterUserId) {
          return; // Skip this output if it doesn't belong to the filtered user
        }
      }

      // Apply tag/taskType filter if needed
      if (tagFilteredPromptIds && output.runs) {
        const runPromptId = Array.isArray(output.runs) ? output.runs[0]?.prompt_id : output.runs?.prompt_id;
        if (!tagFilteredPromptIds.includes(runPromptId)) {
          return; // Skip this output if it doesn't match the tag filter
        }
      }

      // Apply provider filter if needed (client-side filtering since we can't easily filter nested relations)
      if (provider && provider !== 'all' && output.models?.provider !== provider) {
        return; // Skip this output if it doesn't match the provider filter
      }

      const modelId = output.models?.id || output.model_id;
      if (!modelId) return;

      if (!modelAggregates.has(modelId)) {
        modelAggregates.set(modelId, {
          modelId: modelId,
          model: output.models?.name || 'Unknown',
          provider: output.models?.provider || 'Unknown',
          version: output.models?.version || null,
          totalScore: 0,
          latencies: [] as number[], // Store all latencies for p95 calculation
          totalInputTokens: 0,
          totalOutputTokens: 0,
          costInputPerMillion: output.models?.cost_input_per_million || 0,
          costOutputPerMillion: output.models?.cost_output_per_million || 0,
          runCount: 0,
          ubuntuAlignmentCount: 0, // For Ubuntu Rate calculation
          clarityScoreSum: 0,
          creativityScoreSum: 0,
          helpfulnessScoreSum: 0,
          clarityCount: 0,
          creativityCount: 0,
          helpfulnessCount: 0,
          latestUpdatedAt: output.models?.updated_at || output.created_at,
        });
      }

      const agg = modelAggregates.get(modelId);
      agg.totalScore += parseFloat(output.computed_score) || 0;
      if (output.latency_ms) {
        agg.latencies.push(output.latency_ms);
      }
      agg.totalInputTokens += output.input_tokens || 0;
      agg.totalOutputTokens += output.output_tokens || 0;
      agg.runCount++;
      
      // Update latest updated_at if this output is newer
      const outputDate = new Date(output.created_at);
      const currentLatest = new Date(agg.latestUpdatedAt);
      if (outputDate > currentLatest) {
        agg.latestUpdatedAt = output.created_at;
      }

      // Process ratings
      if (output.ratings && Array.isArray(output.ratings)) {
        output.ratings.forEach((rating: any) => {
          const criterion = criteriaMap.get(rating.criterion_id);
          if (!criterion) return;

          const criterionName = criterion.name;
          let scoreValue: number;

          // Handle boolean vs slider types
          if (criterion.type === 'boolean') {
            scoreValue = rating.boolean_value ? 1 : 0;
          } else {
            scoreValue = rating.value || 0;
          }

          // Sum individual criterion scores
          if (criterionName === 'Clarity') {
            agg.clarityScoreSum += scoreValue;
            agg.clarityCount++;
          } else if (criterionName === 'Creativity') {
            agg.creativityScoreSum += scoreValue;
            agg.creativityCount++;
          } else if (criterionName === 'Helpfulness') {
            agg.helpfulnessScoreSum += scoreValue;
            agg.helpfulnessCount++;
          } else if (criterionName === 'Ubuntu Alignment' && scoreValue === 1) {
            agg.ubuntuAlignmentCount++;
          }
        });
      }
    });

    // Convert aggregates to leaderboard format matching frontend interface
    const leaderboardData = Array.from(modelAggregates.values()).map((agg) => {
      // Calculate p95 latency
      let p95LatencyMs = 0;
      if (agg.latencies.length > 0) {
        const sortedLatencies = [...agg.latencies].sort((a, b) => a - b);
        const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
        p95LatencyMs = sortedLatencies[Math.max(0, p95Index)];
      }

      // Calculate cost per 1k tokens
      // Cost = (input_tokens / 1M) * cost_input_per_million + (output_tokens / 1M) * cost_output_per_million
      // Cost per 1k = (total_cost / total_tokens) * 1000
      const totalTokens = agg.totalInputTokens + agg.totalOutputTokens;
      let costPer1k = 0;
      if (totalTokens > 0 && (agg.costInputPerMillion > 0 || agg.costOutputPerMillion > 0)) {
        const totalCost = 
          (agg.totalInputTokens / 1_000_000) * (agg.costInputPerMillion || 0) +
          (agg.totalOutputTokens / 1_000_000) * (agg.costOutputPerMillion || 0);
        costPer1k = (totalCost / totalTokens) * 1000;
      }

      return {
        modelId: agg.modelId,
        model: agg.model,
        provider: agg.provider,
        overall: agg.runCount > 0 ? parseFloat((agg.totalScore / agg.runCount).toFixed(2)) : 0,
        ubuntuPct: agg.runCount > 0 
          ? parseFloat(((agg.ubuntuAlignmentCount / agg.runCount)).toFixed(3)) 
          : 0, // decimal 0-1, not percentage
        clarity: agg.clarityCount > 0 
          ? parseFloat((agg.clarityScoreSum / agg.clarityCount).toFixed(2)) 
          : 0, // default to 0 instead of null
        helpfulness: agg.helpfulnessCount > 0 
          ? parseFloat((agg.helpfulnessScoreSum / agg.helpfulnessCount).toFixed(2)) 
          : 0, // default to 0 instead of null
        creativity: agg.creativityCount > 0 
          ? parseFloat((agg.creativityScoreSum / agg.creativityCount).toFixed(2)) 
          : 0, // default to 0 instead of null
        p95LatencyMs: p95LatencyMs,
        costPer1k: parseFloat(costPer1k.toFixed(6)),
        runs: agg.runCount,
        updatedAt: agg.latestUpdatedAt,
      };
    });

    // Sort by overall score descending by default
    leaderboardData.sort((a, b) => b.overall - a.overall);

    res.status(200).json(leaderboardData);
  } catch (error: any) {
    console.error('API Leaderboard Error:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

