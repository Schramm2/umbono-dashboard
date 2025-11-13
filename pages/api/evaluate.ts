import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

    let totalWeightedScore = 0;
    const ratingsToInsert = userRatings.map((rating: any) => {
      const criterion = criteriaMap.get(rating.criterion_id);
      if (!criterion) {
        throw new Error(`Criterion with ID ${rating.criterion_id} not found.`);
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
        criterion_id: rating.criterion_id,
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

