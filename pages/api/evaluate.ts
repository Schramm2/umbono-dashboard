import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req, res);
  if (preflightResponse) return preflightResponse;

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { run_id, output_id, ratings: userRatings } = req.body;

  if (!run_id || !output_id || !userRatings || !Array.isArray(userRatings) || userRatings.length === 0) {
    return res.status(400).json({ message: 'Missing required evaluation data.' });
  }

  try {
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

    let totalWeightedScore = 0;
    const ratingsToInsert = userRatings.map((rating: any) => {
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

      let scoreValue = rating.score_value;
      let value: number | null = null;
      let boolean_value: boolean | null = null;

      // Handle boolean (Ubuntu Alignment) mapping
      if (criterion.type === 'boolean') {
        // Convert boolean to numeric: true = 1, false = 0
        boolean_value = Boolean(scoreValue);
        scoreValue = boolean_value ? 1 : 0;
      } else {
        // For slider type, store as integer value
        value = Number(scoreValue);
      }

      // Calculate weighted score
      totalWeightedScore += scoreValue * criterion.weight;

      return {
        output_id,
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
      .eq('id', output_id);

    if (updateOutputError) {
      throw new Error(updateOutputError.message || 'Failed to update output score.');
    }

    return res.status(200).json({
      message: 'Evaluation saved successfully!',
      computed_score: totalWeightedScore,
    });
  } catch (error: any) {
    console.error('API Evaluate Error:', error.message);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

