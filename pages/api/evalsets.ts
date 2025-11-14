import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';

// Initialize clients (ensure API keys are in .env.local)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req.headers.origin);
    res.status(200).end();
    return;
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  // GET: List all eval sets or get specific eval set with prompts
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      // If id is provided, fetch single eval set with prompts (for detail view)
      if (id && typeof id === 'string') {
        const { data: evalSet, error: evalSetError } = await supabase
          .from('eval_sets')
          .select('id, name, description, created_at, updated_at')
          .eq('id', id)
          .single();

        if (evalSetError || !evalSet) {
          res.status(404).json({ message: 'Eval set not found' });
          return;
        }

        // Fetch prompts for this eval set
        const { data: evalSetPrompts, error: promptsError } = await supabase
          .from('eval_set_prompts')
          .select(`
            id,
            prompt_id,
            created_at,
            prompts (
              id,
              text,
              title,
              description,
              created_at,
              updated_at
            )
          `)
          .eq('eval_set_id', id)
          .order('created_at', { ascending: true });

        if (promptsError) {
          throw new Error(promptsError.message);
        }

        // Transform prompts data
        const prompts = (evalSetPrompts || []).map((esp: any) => ({
          id: esp.id,
          promptId: esp.prompt_id,
          createdAt: esp.created_at,
          prompt: esp.prompts ? {
            id: esp.prompts.id,
            text: esp.prompts.text,
            title: esp.prompts.title,
            description: esp.prompts.description,
            created_at: esp.prompts.created_at,
            updated_at: esp.prompts.updated_at,
          } : null,
        }));

        res.status(200).json({
          ...evalSet,
          prompts,
          promptCount: prompts.length,
        });
        return;
      }

      // Otherwise, list all eval sets with prompt counts
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

      res.status(200).json(evalSetsWithCounts);
      return;
    } catch (error: any) {
      console.error('API EvalSets Error:', error.message);
      res.status(500).json({ message: 'Internal server error', error: error.message });
      return;
    }
  }

  // POST: Create eval set, duplicate, archive, run batch, or add prompt
  if (req.method === 'POST') {
    const { action } = req.body;

    // Duplicate eval set
    if (action === 'duplicate') {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ message: 'Eval set ID is required for duplication' });
        return;
      }

      try {
        // Fetch the original eval set
        const { data: originalSet, error: fetchError } = await supabase
          .from('eval_sets')
          .select('name, description')
          .eq('id', id)
          .single();

        if (fetchError || !originalSet) {
          res.status(404).json({ message: 'Eval set not found' });
          return;
        }

        // Fetch all prompts from the original set
        const { data: originalPrompts, error: promptsError } = await supabase
          .from('eval_set_prompts')
          .select('prompt_id')
          .eq('eval_set_id', id);

        if (promptsError) {
          throw new Error(promptsError.message);
        }

        // Create new eval set with copied name
        const { data: newEvalSet, error: createError } = await supabase
          .from('eval_sets')
          .insert({
            name: `${originalSet.name} (Copy)`,
            description: originalSet.description,
          })
          .select('id, name, description, created_at, updated_at')
          .single();

        if (createError || !newEvalSet) {
          throw new Error(createError?.message || 'Failed to create duplicate eval set');
        }

        // Copy all prompts to the new set
        if (originalPrompts && originalPrompts.length > 0) {
          const promptsToInsert = originalPrompts.map((p: any) => ({
            eval_set_id: newEvalSet.id,
            prompt_id: p.prompt_id,
          }));

          const { error: insertPromptsError } = await supabase
            .from('eval_set_prompts')
            .insert(promptsToInsert);

          if (insertPromptsError) {
            throw new Error(insertPromptsError.message);
          }
        }

        res.status(201).json({
          ...newEvalSet,
          promptCount: originalPrompts?.length || 0,
        });
        return;
      } catch (error: any) {
        console.error('API EvalSets Duplicate Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Archive eval set (using soft delete pattern - add archived_at field if needed)
    if (action === 'archive') {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ message: 'Eval set ID is required for archiving' });
        return;
      }

      try {
        // Check if eval set exists
        const { data: evalSet, error: checkError } = await supabase
          .from('eval_sets')
          .select('id')
          .eq('id', id)
          .single();

        if (checkError || !evalSet) {
          res.status(404).json({ message: 'Eval set not found' });
          return;
        }

        // Note: This assumes an 'archived' boolean field exists in the schema
        // If not, you may need to add it: ALTER TABLE eval_sets ADD COLUMN archived BOOLEAN DEFAULT false;
        const { error: updateError } = await supabase
          .from('eval_sets')
          .update({ archived: true })
          .eq('id', id);

        if (updateError) {
          // If archived field doesn't exist, return a message suggesting schema update
          res.status(500).json({
            message: 'Archive functionality requires an "archived" field in eval_sets table',
            error: updateError.message,
          });
          return;
        }

        res.status(200).json({ message: 'Eval set archived successfully' });
        return;
      } catch (error: any) {
        console.error('API EvalSets Archive Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Run batch evaluation
    if (action === 'run-batch') {
      const { id, model_ids, temperature, max_tokens } = req.body;
      if (!id) {
        res.status(400).json({ message: 'Eval set ID is required for batch run' });
        return;
      }
      if (!model_ids || !Array.isArray(model_ids) || model_ids.length === 0) {
        res.status(400).json({ message: 'At least one model ID is required' });
        return;
      }

      try {
        // Fetch model details
        const { data: models, error: modelsError } = await supabase
          .from('models')
          .select('id, name, provider, version, cost_input_per_million, cost_output_per_million, max_tokens')
          .in('id', model_ids);

        if (modelsError || !models || models.length === 0) {
          res.status(404).json({ message: 'Selected models not found' });
          return;
        }

        // Fetch all prompts in the eval set
        const { data: evalSetPrompts, error: promptsError } = await supabase
          .from('eval_set_prompts')
          .select('prompt_id, prompts(text)')
          .eq('eval_set_id', id);

        if (promptsError) {
          throw new Error(promptsError.message);
        }

        if (!evalSetPrompts || evalSetPrompts.length === 0) {
          res.status(400).json({ message: 'No prompts found in this eval set' });
          return;
        }

        // Execute batch runs for each prompt
        const batchResults = [];
        for (const esp of evalSetPrompts) {
          const promptText = (esp.prompts as any)?.text;
          if (!promptText) continue;

          try {
            // Create prompt and run records
            const { data: insertedPrompt, error: promptError } = await supabase
              .from('prompts')
              .insert({ text: promptText })
              .select('id')
              .single();

            if (promptError || !insertedPrompt) {
              console.error('Failed to create prompt:', promptError?.message);
              continue;
            }

            const { data: insertedRun, error: runError } = await supabase
              .from('runs')
              .insert({ prompt_id: insertedPrompt.id })
              .select('id')
              .single();

            if (runError || !insertedRun) {
              console.error('Failed to create run:', runError?.message);
              continue;
            }

            const runId = insertedRun.id;
            const maxTokens = max_tokens || 4096;

            // Execute API calls for all models in parallel
            const outputPromises = models.map(async (model) => {
              const startTime = Date.now();
              let modelOutputText = '';
              let inputTokens = 0;
              let outputTokens = 0;
              let error: string | null = null;

              try {
                const modelMaxTokens = model.max_tokens || maxTokens;

                switch (model.provider) {
                  case 'OpenAI':
                    const openAICompletion = await openai.chat.completions.create({
                      model: model.version,
                      messages: [{ role: 'user', content: promptText }],
                      max_tokens: modelMaxTokens,
                      temperature: temperature,
                    });
                    modelOutputText = openAICompletion.choices[0]?.message?.content || '';
                    inputTokens = openAICompletion.usage?.prompt_tokens || 0;
                    outputTokens = openAICompletion.usage?.completion_tokens || 0;
                    break;

                  case 'Anthropic':
                    const anthropicCompletion = await anthropic.messages.create({
                      model: model.version,
                      max_tokens: modelMaxTokens,
                      messages: [{ role: 'user', content: promptText }],
                      temperature: temperature,
                    });
                    const anthropicContent = anthropicCompletion.content[0];
                    if (anthropicContent && 'text' in anthropicContent) {
                      modelOutputText = anthropicContent.text || '';
                    } else {
                      modelOutputText = JSON.stringify(anthropicContent) || '';
                    }
                    inputTokens = anthropicCompletion.usage.input_tokens || 0;
                    outputTokens = anthropicCompletion.usage.output_tokens || 0;
                    break;

                  case 'Google':
                    const googleModelName = model.version;
                    const googleModel = genAI.getGenerativeModel({ model: googleModelName });
                    const googleResult = await googleModel.generateContent(promptText);
                    const googleResponse = googleResult.response;
                    modelOutputText = googleResponse.text();
                    const googleTokenCount = await googleModel.countTokens(promptText);
                    inputTokens = googleTokenCount.totalTokens || 0;
                    outputTokens = modelOutputText.split(/\s+/).length;
                    break;

                  case 'Mistral AI':
                    const mistralCompletion = await mistral.chat.complete({
                      model: model.version,
                      messages: [{ role: 'user', content: promptText }],
                      temperature: temperature,
                      maxTokens: modelMaxTokens,
                    });
                    const mistralContent = mistralCompletion.choices[0]?.message.content;
                    if (typeof mistralContent === 'string') {
                      modelOutputText = mistralContent;
                    } else if (Array.isArray(mistralContent)) {
                      modelOutputText = mistralContent
                        .map(chunk => {
                          if (typeof chunk === 'string') return chunk;
                          if (chunk.type === 'text' && 'text' in chunk) return chunk.text;
                          return '';
                        })
                        .join('');
                    } else {
                      modelOutputText = '';
                    }
                    inputTokens = mistralCompletion.usage?.promptTokens || 0;
                    outputTokens = mistralCompletion.usage?.completionTokens || 0;
                    break;

                  default:
                    modelOutputText = `(Provider ${model.provider} not supported)`;
                    error = `Provider ${model.provider} not supported.`;
                }
              } catch (e: any) {
                console.error(`Error with ${model.name} (${model.provider}):`, e.message);
                modelOutputText = `Error generating response: ${e.message}`;
                error = e.message;
              } finally {
                const endTime = Date.now();
                const latency_ms = endTime - startTime;
                const cost =
                  ((inputTokens || 0) / 1_000_000) * (model.cost_input_per_million || 0) +
                  ((outputTokens || 0) / 1_000_000) * (model.cost_output_per_million || 0);

                return {
                  model_id: model.id,
                  model_name: model.name,
                  text: modelOutputText,
                  latency_ms,
                  input_tokens: inputTokens,
                  output_tokens: outputTokens,
                  cost: parseFloat(cost.toFixed(6)),
                  error,
                };
              }
            });

            const results = await Promise.all(outputPromises);

            // Store outputs in Supabase
            const outputsToInsert = results.map((result) => ({
              run_id: runId,
              model_id: result.model_id,
              text: result.text,
              latency_ms: result.latency_ms,
              input_tokens: result.input_tokens,
              output_tokens: result.output_tokens,
              tokens_used: result.input_tokens + result.output_tokens,
              cost: result.cost,
              error: result.error,
            }));

            const { error: outputsError } = await supabase.from('outputs').insert(outputsToInsert);

            if (outputsError) {
              console.error('Failed to save outputs:', outputsError.message);
            }

            batchResults.push({
              prompt_id: insertedPrompt.id,
              run_id: runId,
              prompt_text: promptText.substring(0, 100) + '...',
              outputs_count: results.length,
            });
          } catch (error: any) {
            console.error('Error processing prompt in batch:', error.message);
            // Continue with next prompt
          }
        }

        res.status(200).json({
          message: `Batch run completed for ${batchResults.length} prompts`,
          results: batchResults,
        });
        return;
      } catch (error: any) {
        console.error('API EvalSets Run Batch Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Add prompt to eval set
    if (action === 'add-prompt') {
      const { eval_set_id, prompt_id, prompt_text } = req.body;
      if (!eval_set_id) {
        res.status(400).json({ message: 'Eval set ID is required' });
        return;
      }

      try {
        let actualPromptId = prompt_id;

        // If prompt_text is provided but no prompt_id, create a new prompt
        if (prompt_text && !prompt_id) {
          const { data: newPrompt, error: createPromptError } = await supabase
            .from('prompts')
            .insert({ text: prompt_text })
            .select('id')
            .single();

          if (createPromptError || !newPrompt) {
            throw new Error(createPromptError?.message || 'Failed to create prompt');
          }

          actualPromptId = newPrompt.id;
        } else if (!prompt_id) {
          res.status(400).json({ message: 'Either prompt_id or prompt_text is required' });
          return;
        }

        // Check if prompt already exists in set
        const { data: existing } = await supabase
          .from('eval_set_prompts')
          .select('id')
          .eq('eval_set_id', eval_set_id)
          .eq('prompt_id', actualPromptId)
          .single();

        if (existing) {
          res.status(400).json({ message: 'Prompt already exists in this eval set' });
          return;
        }

        // Add prompt to eval set
        const { data: newEvalSetPrompt, error: addError } = await supabase
          .from('eval_set_prompts')
          .insert({
            eval_set_id,
            prompt_id: actualPromptId,
          })
          .select(`
            id,
            prompt_id,
            created_at,
            prompts (
              id,
              text,
              title,
              description,
              created_at,
              updated_at
            )
          `)
          .single();

        if (addError) {
          throw new Error(addError.message);
        }

        res.status(201).json({
          id: newEvalSetPrompt.id,
          promptId: newEvalSetPrompt.prompt_id,
          createdAt: newEvalSetPrompt.created_at,
          prompt: newEvalSetPrompt.prompts,
        });
        return;
      } catch (error: any) {
        console.error('API EvalSets Add Prompt Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Default POST: Create new eval set
    const { name, description } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ message: 'Name is required and must be a non-empty string.' });
      return;
    }

    // Validate name length (matches database constraint)
    if (name.length > 255) {
      res.status(400).json({ message: 'Name must be 255 characters or less.' });
      return;
    }

    try {
      // Insert new eval set
      const { data: newEvalSet, error } = await supabase
        .from('eval_sets')
        .insert({
          name: name.trim(),
          description: description ? description.trim() : null,
        })
        .select('id, name, description, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Return the created eval set with promptCount set to 0
      res.status(201).json({
        ...newEvalSet,
        promptCount: 0,
      });
      return;
    } catch (error: any) {
      console.error('API EvalSets Create Error:', error.message);
      res.status(500).json({ message: 'Internal server error', error: error.message });
      return;
    }
  }

  // PUT: Update eval set, edit prompt, reorder prompts, update models, update parameters
  if (req.method === 'PUT') {
    const { action } = req.body;

    // Update eval set (name/description)
    if (!action || action === 'update') {
      const { id, name, description } = req.body;
      if (!id) {
        res.status(400).json({ message: 'Eval set ID is required' });
        return;
      }

      try {
        const updateData: any = {};
        if (name !== undefined) {
          if (typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: 'Name must be a non-empty string' });
            return;
          }
          if (name.length > 255) {
            res.status(400).json({ message: 'Name must be 255 characters or less' });
            return;
          }
          updateData.name = name.trim();
        }
        if (description !== undefined) {
          updateData.description = description ? description.trim() : null;
        }

        const { data: updatedSet, error } = await supabase
          .from('eval_sets')
          .update(updateData)
          .eq('id', id)
          .select('id, name, description, created_at, updated_at')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (!updatedSet) {
          res.status(404).json({ message: 'Eval set not found' });
          return;
        }

        res.status(200).json(updatedSet);
        return;
      } catch (error: any) {
        console.error('API EvalSets Update Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Edit prompt
    if (action === 'edit-prompt') {
      const { prompt_id, text, title, description } = req.body;
      if (!prompt_id) {
        res.status(400).json({ message: 'Prompt ID is required' });
        return;
      }
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ message: 'Prompt text is required' });
        return;
      }

      try {
        const updateData: any = { text: text.trim() };
        if (title !== undefined) {
          updateData.title = title ? title.trim() : null;
        }
        if (description !== undefined) {
          updateData.description = description ? description.trim() : null;
        }

        const { data: updatedPrompt, error } = await supabase
          .from('prompts')
          .update(updateData)
          .eq('id', prompt_id)
          .select('id, text, title, description, created_at, updated_at')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (!updatedPrompt) {
          res.status(404).json({ message: 'Prompt not found' });
          return;
        }

        res.status(200).json(updatedPrompt);
        return;
      } catch (error: any) {
        console.error('API EvalSets Edit Prompt Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Reorder prompts
    if (action === 'reorder-prompts') {
      const { eval_set_id, prompt_orders } = req.body; // prompt_orders: [{ id, order }]
      if (!eval_set_id) {
        res.status(400).json({ message: 'Eval set ID is required' });
        return;
      }
      if (!prompt_orders || !Array.isArray(prompt_orders)) {
        res.status(400).json({ message: 'prompt_orders array is required' });
        return;
      }

      try {
        // Note: This assumes an 'order' field exists in eval_set_prompts table
        // If not, you may need to add it: ALTER TABLE eval_set_prompts ADD COLUMN "order" INTEGER;
        const updates = prompt_orders.map((po: any) => ({
          id: po.id,
          order: po.order,
        }));

        // Update each prompt's order
        for (const update of updates) {
          const { error } = await supabase
            .from('eval_set_prompts')
            .update({ order: update.order })
            .eq('id', update.id)
            .eq('eval_set_id', eval_set_id);

          if (error) {
            throw new Error(`Failed to update order for prompt ${update.id}: ${error.message}`);
          }
        }

        res.status(200).json({ message: 'Prompts reordered successfully' });
        return;
      } catch (error: any) {
        console.error('API EvalSets Reorder Prompts Error:', error.message);
        res.status(500).json({
          message: 'Reorder functionality may require an "order" field in eval_set_prompts table',
          error: error.message,
        });
        return;
      }
    }

    // Update default models for eval set
    if (action === 'update-models') {
      const { id, model_ids } = req.body;
      if (!id) {
        res.status(400).json({ message: 'Eval set ID is required' });
        return;
      }
      if (!model_ids || !Array.isArray(model_ids)) {
        res.status(400).json({ message: 'model_ids array is required' });
        return;
      }

      try {
        // Note: This assumes a JSON field 'default_models' exists in eval_sets table
        // If not, you may need to add it: ALTER TABLE eval_sets ADD COLUMN default_models JSONB;
        const { error } = await supabase
          .from('eval_sets')
          .update({ default_models: model_ids })
          .eq('id', id);

        if (error) {
          res.status(500).json({
            message: 'Update models functionality may require a "default_models" JSONB field in eval_sets table',
            error: error.message,
          });
          return;
        }

        res.status(200).json({ message: 'Default models updated successfully', model_ids });
        return;
      } catch (error: any) {
        console.error('API EvalSets Update Models Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Update default parameters for eval set
    if (action === 'update-parameters') {
      const { id, parameters } = req.body; // parameters: { temperature, max_tokens, etc. }
      if (!id) {
        res.status(400).json({ message: 'Eval set ID is required' });
        return;
      }
      if (!parameters || typeof parameters !== 'object') {
        res.status(400).json({ message: 'parameters object is required' });
        return;
      }

      try {
        // Note: This assumes a JSON field 'default_parameters' exists in eval_sets table
        // If not, you may need to add it: ALTER TABLE eval_sets ADD COLUMN default_parameters JSONB;
        const { error } = await supabase
          .from('eval_sets')
          .update({ default_parameters: parameters })
          .eq('id', id);

        if (error) {
          res.status(500).json({
            message: 'Update parameters functionality may require a "default_parameters" JSONB field in eval_sets table',
            error: error.message,
          });
          return;
        }

        res.status(200).json({ message: 'Default parameters updated successfully', parameters });
        return;
      } catch (error: any) {
        console.error('API EvalSets Update Parameters Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    res.status(400).json({ message: 'Invalid action for PUT request' });
    return;
  }

  // DELETE: Delete eval set or remove prompt from set
  if (req.method === 'DELETE') {
    const { id, eval_set_id, prompt_id, eval_set_prompt_id } = req.query;

    // Delete prompt from eval set
    if (eval_set_prompt_id || (eval_set_id && prompt_id)) {
      try {
        let deleteQuery = supabase.from('eval_set_prompts').delete();

        if (eval_set_prompt_id) {
          deleteQuery = deleteQuery.eq('id', eval_set_prompt_id);
        } else if (eval_set_id && prompt_id) {
          deleteQuery = deleteQuery.eq('eval_set_id', eval_set_id).eq('prompt_id', prompt_id);
        } else {
          res.status(400).json({ message: 'Either eval_set_prompt_id or both eval_set_id and prompt_id are required' });
          return;
        }

        const { error } = await deleteQuery;

        if (error) {
          throw new Error(error.message);
        }

        res.status(200).json({ message: 'Prompt removed from eval set successfully' });
        return;
      } catch (error: any) {
        console.error('API EvalSets Delete Prompt Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    // Delete eval set
    if (id) {
      try {
        // Check if eval set exists
        const { data: evalSet, error: checkError } = await supabase
          .from('eval_sets')
          .select('id')
          .eq('id', id)
          .single();

        if (checkError || !evalSet) {
          res.status(404).json({ message: 'Eval set not found' });
          return;
        }

        // Delete eval set (cascade will delete eval_set_prompts)
        const { error } = await supabase.from('eval_sets').delete().eq('id', id);

        if (error) {
          throw new Error(error.message);
        }

        res.status(200).json({ message: 'Eval set deleted successfully' });
        return;
      } catch (error: any) {
        console.error('API EvalSets Delete Error:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
        return;
      }
    }

    res.status(400).json({ message: 'ID or eval_set_prompt_id is required for DELETE request' });
    return;
  }

  // Method not allowed
  res.status(405).json({ message: 'Method not allowed' });
}

