/**
 * @file pages/api/evaluate.ts
 * @description API route handler for calculating and saving human evaluation scores.
 * Features:
 * - Translates slider scores and boolean parameters (like Ubuntu Alignment) into numeric weights.
 * - Computes total weighted scores dynamically based on configured evaluation weights.
 * - Upserts rating records to prevent duplicates and writes computed score results to outputs.
 * - DEMO_MODE toggle: Calculates scores locally without requiring database writes.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseClient } from '../../lib/supabase-server';
import { requireAuth } from '../../lib/auth';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';
import { isDemoMode } from '../../lib/demo-mode';
import { scoreDemoRatings } from '../../lib/demo-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // Require authentication for evaluation
  const auth = await requireAuth(req, res);
  if (!auth) return; // Response already sent by requireAuth

  // Extract auth token and create authenticated Supabase client
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || authHeader;
  const supabase = createSupabaseClient(token);

  const { run_id, output_id, ratings: userRatings } = req.body;

  if (!run_id || !output_id || !userRatings || !Array.isArray(userRatings) || userRatings.length === 0) {
    res.status(400).json({ message: 'Missing required evaluation data.' });
    return;
  }

  if (isDemoMode) {
    const computedScore = scoreDemoRatings(userRatings);
    res.status(200).json({
      message: 'Demo evaluation scored locally. No database write was performed.',
      computed_score: computedScore,
      score: computedScore,
      simulated: true,
    });
    return;
  }

  try {
    // The frontend sends model_id as output_id, so we need to look up the actual output record
    // using run_id and model_id combination (which has a UNIQUE constraint)
    const { data: outputRecord, error: outputLookupError } = await supabase
      .from('outputs')
      .select('id')
      .eq('run_id', run_id)
      .eq('model_id', output_id)
      .single();
    
    let actualOutputId: string;
    
    if (outputLookupError || !outputRecord) {
      // If lookup fails, try using output_id directly as the output id (for backward compatibility)
      // First verify it exists
      const { data: directOutput, error: directError } = await supabase
        .from('outputs')
        .select('id, run_id')
        .eq('id', output_id)
        .single();
      
      if (directError || !directOutput) {
        res.status(404).json({ 
          message: `Output not found. Tried lookup by run_id: ${run_id} and model_id: ${output_id}, and by output_id: ${output_id}. ${outputLookupError?.message || directError?.message || ''}` 
        });
        return;
      }
      
      // Verify the run_id matches
      if (directOutput.run_id !== run_id) {
        res.status(400).json({ 
          message: `Output ${output_id} does not belong to run ${run_id}.` 
        });
        return;
      }
      
      actualOutputId = output_id;
    } else {
      actualOutputId = outputRecord.id;
    }
    // Fetch all criteria with their weights
    const { data: criteria, error: criteriaError } = await supabase
      .from('evaluation_criteria')
      .select('id, name, type, weight');

    if (criteriaError || !criteria) {
      throw new Error(criteriaError?.message || 'Failed to fetch evaluation criteria.');
    }

    // Create maps for both ID and name lookups (frontend may send either)
    const criteriaMapById = new Map(criteria.map((c) => [c.id, c]));
    const criteriaMapByName = new Map(
      criteria.map((c) => [c.name.toLowerCase().replace(/\s+/g, '_'), c])
    );

    // Track processed criteria to prevent duplicates
    const processedCriteriaIds = new Set<string>();
    
    let totalWeightedScore = 0;
    const ratingsToInsert = userRatings
      .filter((rating: any) => {
        // Try to find criterion by ID first, then by name (normalized)
        let criterion = criteriaMapById.get(rating.criterion_id);
        if (!criterion) {
          // Normalize the criterion_id to match the name format (lowercase, underscores)
          const normalizedName = rating.criterion_id.toLowerCase().replace(/\s+/g, '_');
          criterion = criteriaMapByName.get(normalizedName);
        }
        
        if (!criterion) {
          throw new Error(`Criterion with ID/name "${rating.criterion_id}" not found. Available criteria: ${criteria.map(c => c.name).join(', ')}`);
        }

        // Check for duplicate criteria in the same request
        if (processedCriteriaIds.has(criterion.id)) {
          return false; // Filter out duplicate
        }
        processedCriteriaIds.add(criterion.id);
        return true; // Keep this rating
      })
      .map((rating: any) => {
        // Find criterion again (we know it exists from filter step)
        let criterion = criteriaMapById.get(rating.criterion_id);
        if (!criterion) {
          const normalizedName = rating.criterion_id.toLowerCase().replace(/\s+/g, '_');
          criterion = criteriaMapByName.get(normalizedName);
        }
        
        if (!criterion) {
          throw new Error(`Criterion with ID/name "${rating.criterion_id}" not found.`);
        }

      let scoreValue = rating.score_value;
      let value: number | null = null;
      let boolean_value: boolean | null = null;

      // Handle boolean (Ubuntu Alignment) mapping
      if (criterion.type === 'boolean') {
        // Convert boolean to numeric: true = 1, false = 0
        boolean_value = Boolean(scoreValue);
        scoreValue = boolean_value ? 1 : 0;
      } else {
        // For slider type, convert to number and store as integer value
        scoreValue = Number(scoreValue);
        if (isNaN(scoreValue)) {
          throw new Error(`Invalid score value "${rating.score_value}" for criterion "${criterion.name}". Expected a number.`);
        }
        // Ensure score is within valid range (1-5 for sliders)
        if (scoreValue < 1 || scoreValue > 5) {
          scoreValue = Math.max(1, Math.min(5, scoreValue));
        }
        value = Math.round(scoreValue); // Round to integer for database storage
      }

      // Calculate weighted score using the numeric scoreValue
      // Use frontend weights to match the UI calculation:
      // Clarity: 0.3, Helpfulness: 0.4, Creativity: 0.2, Ubuntu Alignment: 0.5
      // These weights are normalized to sum to 1.4, giving a max score of 5.0
      let weight = Number(criterion.weight) || 0;
      
      // Override database weights with frontend weights for consistency
      const criterionNameLower = criterion.name.toLowerCase();
      if (criterionNameLower === 'clarity') {
        weight = 0.3;
      } else if (criterionNameLower === 'helpfulness') {
        weight = 0.4;
      } else if (criterionNameLower === 'creativity') {
        weight = 0.2;
      } else if (criterionNameLower.includes('ubuntu')) {
        weight = 0.5;
      }
      
      const weightedContribution = scoreValue * weight;
      totalWeightedScore += weightedContribution;

      return {
        output_id: actualOutputId, // Use the actual output UUID from the database
        criterion_id: criterion.id, // Use the actual UUID from the database
        value,
        boolean_value,
      };
    });

    // Insert ratings (upsert if re-evaluating)
    const { error: insertRatingsError } = await supabase
      .from('ratings')
      .upsert(ratingsToInsert, { onConflict: 'output_id, criterion_id' });

    if (insertRatingsError) {
      throw new Error(insertRatingsError.message || 'Failed to save ratings.');
    }

    // Update the output with the computed total score
    const { error: updateOutputError } = await supabase
      .from('outputs')
      .update({ computed_score: totalWeightedScore })
      .eq('id', actualOutputId);

    if (updateOutputError) {
      throw new Error(updateOutputError.message || 'Failed to update output score.');
    }

    // Return both computed_score (for consistency) and score (for frontend compatibility)
    res.status(200).json({
      message: 'Evaluation saved successfully!',
      computed_score: totalWeightedScore,
      score: totalWeightedScore, // Also return as 'score' for frontend compatibility
    });
  } catch (error: any) {
    console.error('API Evaluate Error:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
