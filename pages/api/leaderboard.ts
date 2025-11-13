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

  const { dateRange, modelId, tag } = req.query;

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
        created_at,
        models (
          id,
          name,
          provider,
          version
        ),
        runs (
          id,
          created_at,
          prompt_id
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

      if (dateRange === 'Last 7 days') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'Last 30 days') {
        startDate.setDate(now.getDate() - 30);
      } else if (dateRange === 'Last 90 days') {
        startDate.setDate(now.getDate() - 90);
      } else if (dateRange === 'Last year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      // For custom date ranges, you could parse ISO strings here

      // Filter by outputs created_at (which should align with runs.created_at)
      query = query.gte('created_at', startDate.toISOString());
    }

    // Apply model ID filter
    if (modelId) {
      query = query.eq('model_id', modelId as string);
    }

    // Tag filtering - requires joining through eval_set_prompts and eval_sets
    // For MVP, we'll implement a simplified version
    // If tag is provided, we need to filter by eval_set_id
    // This requires a more complex query structure
    let tagFilteredPromptIds: string[] | null = null;
    if (tag) {
      // First, find the eval_set_id by tag name
      const { data: evalSet, error: evalSetError } = await supabase
        .from('eval_sets')
        .select('id')
        .eq('name', tag as string)
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

    const { data: rawData, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!rawData || rawData.length === 0) {
      return res.status(200).json([]);
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
      // Apply tag filter if needed
      if (tagFilteredPromptIds && output.runs) {
        const runPromptId = Array.isArray(output.runs) ? output.runs[0]?.prompt_id : output.runs?.prompt_id;
        if (!tagFilteredPromptIds.includes(runPromptId)) {
          return; // Skip this output if it doesn't match the tag filter
        }
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
          totalLatency: 0,
          totalCost: 0,
          runCount: 0,
          ubuntuAlignmentCount: 0, // For Ubuntu Rate calculation
          clarityScoreSum: 0,
          creativityScoreSum: 0,
          helpfulnessScoreSum: 0,
          clarityCount: 0,
          creativityCount: 0,
          helpfulnessCount: 0,
        });
      }

      const agg = modelAggregates.get(modelId);
      agg.totalScore += parseFloat(output.computed_score) || 0;
      agg.totalLatency += output.latency_ms || 0;
      agg.totalCost += parseFloat(output.cost) || 0;
      agg.runCount++;

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

    // Convert aggregates to leaderboard format
    const leaderboardData = Array.from(modelAggregates.values()).map((agg) => ({
      modelId: agg.modelId,
      model: agg.model,
      provider: agg.provider,
      version: agg.version,
      avgScore: agg.runCount > 0 ? parseFloat((agg.totalScore / agg.runCount).toFixed(2)) : 0,
      avgLatency: agg.runCount > 0 ? Math.round(agg.totalLatency / agg.runCount) : 0, // ms
      totalCost: parseFloat(agg.totalCost.toFixed(6)), // dollars
      avgCost: agg.runCount > 0 ? parseFloat((agg.totalCost / agg.runCount).toFixed(6)) : 0, // dollars per run
      runCount: agg.runCount,
      ubuntuRate:
        agg.runCount > 0
          ? parseFloat(((agg.ubuntuAlignmentCount / agg.runCount) * 100).toFixed(1))
          : 0, // percentage
      avgClarity:
        agg.clarityCount > 0 ? parseFloat((agg.clarityScoreSum / agg.clarityCount).toFixed(2)) : null,
      avgCreativity:
        agg.creativityCount > 0 ? parseFloat((agg.creativityScoreSum / agg.creativityCount).toFixed(2)) : null,
      avgHelpfulness:
        agg.helpfulnessCount > 0 ? parseFloat((agg.helpfulnessScoreSum / agg.helpfulnessCount).toFixed(2)) : null,
    }));

    // Sort by average score descending by default
    leaderboardData.sort((a, b) => b.avgScore - a.avgScore);

    return res.status(200).json(leaderboardData);
  } catch (error: any) {
    console.error('API Leaderboard Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

