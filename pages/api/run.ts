import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseClient } from '../../lib/supabase-server';
import { requireAuth } from '../../lib/auth';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import { setCorsHeaders, handleCorsPreflight } from '../../lib/cors';

// Initialize clients (ensure API keys are in .env.local)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (handleCorsPreflight(req, res)) {
    return; // Response already sent by handleCorsPreflight
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  // GET: Fetch run by ID, list templates, or fetch template by ID
  if (req.method === 'GET') {
    // Try to get auth token if available (optional for GET)
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || authHeader;
    const supabase = token ? createSupabaseClient(token) : createSupabaseClient();
    
    const { id, templates, template_id } = req.query;

    // List all templates (prompts with titles)
    if (templates === 'true') {
      try {
        const { data: templatesList, error: templatesError } = await supabase
          .from('prompts')
          .select('id, text, title, description, created_at, updated_at')
          .not('title', 'is', null)
          .order('created_at', { ascending: false });

        if (templatesError) {
          throw new Error(templatesError.message);
        }

        return res.status(200).json(templatesList || []);
      } catch (error: any) {
        console.error('API Run List Templates Error:', error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    }

    // Fetch specific template by ID
    if (template_id && typeof template_id === 'string') {
      try {
        const { data: template, error: templateError } = await supabase
          .from('prompts')
          .select('id, text, title, description, created_at, updated_at')
          .eq('id', template_id)
          .not('title', 'is', null)
          .single();

        if (templateError || !template) {
          return res.status(404).json({ message: 'Template not found' });
        }

        return res.status(200).json(template);
      } catch (error: any) {
        console.error('API Run Get Template Error:', error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    }

    // Fetch run by ID (for sharing functionality)
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Run ID, templates=true, or template_id is required' });
    }

    try {
      // Fetch run with prompt and outputs
      const { data: run, error: runError } = await supabase
        .from('runs')
        .select(`
          id,
          created_at,
          notes,
          prompts (
            id,
            text,
            title,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (runError || !run) {
        return res.status(404).json({ message: 'Run not found' });
      }

      // Fetch outputs with model details
      const { data: outputs, error: outputsError } = await supabase
        .from('outputs')
        .select(`
          id,
          text,
          latency_ms,
          cost,
          input_tokens,
          output_tokens,
          tokens_used,
          error,
          computed_score,
          created_at,
          models (
            id,
            name,
            provider,
            version
          )
        `)
        .eq('run_id', id)
        .order('created_at', { ascending: true });

      if (outputsError) {
        throw new Error(outputsError.message);
      }

      // Transform outputs to include model_name for consistency
      const transformedOutputs = (outputs || []).map((output: any) => ({
        id: output.id,
        model_id: output.models?.id,
        model_name: output.models?.name || 'Unknown Model',
        text: output.text,
        latency_ms: output.latency_ms,
        cost: output.cost,
        input_tokens: output.input_tokens,
        output_tokens: output.output_tokens,
        tokens_used: output.tokens_used,
        error: output.error,
        computed_score: output.computed_score,
        created_at: output.created_at,
      }));

      return res.status(200).json({
        id: run.id,
        created_at: run.created_at,
        notes: run.notes,
        prompt: run.prompts,
        outputs: transformedOutputs,
      });
    } catch (error: any) {
      console.error('API Run GET Error:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  // POST: Create run or save template
  if (req.method === 'POST') {
    // Require authentication for POST operations
    const auth = await requireAuth(req, res);
    if (!auth) return; // Response already sent by requireAuth

    const userId = auth.user.id;
    // Extract auth token and create authenticated Supabase client
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || authHeader;
    const supabase = createSupabaseClient(token);
    const { action } = req.body;

    // Save template action
    if (action === 'save-template') {
      const { prompt_text, title, description } = req.body;

      if (!prompt_text || typeof prompt_text !== 'string' || prompt_text.trim().length === 0) {
        return res.status(400).json({ message: 'Prompt text is required' });
      }

      try {
        const insertData: any = {
          text: prompt_text.trim(),
        };

        if (title !== undefined) {
          insertData.title = title ? title.trim() : null;
        }

        if (description !== undefined) {
          insertData.description = description ? description.trim() : null;
        }

        const { data: savedPrompt, error: promptError } = await supabase
          .from('prompts')
          .insert({ ...insertData, user_id: userId })
          .select('id, text, title, description, created_at, updated_at')
          .single();

        if (promptError || !savedPrompt) {
          throw new Error(promptError?.message || 'Failed to save template');
        }

        return res.status(201).json({
          message: 'Template saved successfully',
          prompt: savedPrompt,
        });
      } catch (error: any) {
        console.error('API Run Save Template Error:', error.message);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    }

    // Default POST: Create new run
    const { prompt, model_ids } = req.body;

    if (!prompt || !model_ids || !Array.isArray(model_ids) || model_ids.length === 0) {
      return res.status(400).json({ message: 'Missing prompt or model IDs.' });
    }

    try {
      // 1. Fetch model details from Supabase
      const { data: models, error: modelsError } = await supabase
        .from('models')
        .select('id, name, provider, version, cost_input_per_million, cost_output_per_million')
        .in('id', model_ids);

      if (modelsError || !models || models.length === 0) {
        console.error('Error fetching model details:', modelsError?.message || 'No models found.');
        return res.status(404).json({ message: 'Selected models not found.' });
      }

      // 2. Insert prompt and run record
      const { data: insertedPrompt, error: promptError } = await supabase
        .from('prompts')
        .insert({ text: prompt, user_id: userId })
        .select('id')
        .single();

      if (promptError || !insertedPrompt) {
        throw new Error(promptError?.message || 'Failed to save prompt.');
      }

      const { data: insertedRun, error: runError } = await supabase
        .from('runs')
        .insert({ prompt_id: insertedPrompt.id, user_id: userId })
        .select('id')
        .single();

      if (runError || !insertedRun) {
        throw new Error(runError?.message || 'Failed to save run.');
      }

      const runId = insertedRun.id;

      // 3. Prepare parallel API calls
      const outputPromises = models.map(async (model) => {
        const startTime = Date.now();
        let modelOutputText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let error: string | null = null;

        try {
          switch (model.provider) {
            case 'OpenAI':
              const openAICompletion = await openai.chat.completions.create({
                model: model.version,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4096, // Or dynamic based on model.max_tokens
              });

              modelOutputText = openAICompletion.choices[0]?.message?.content || '';
              inputTokens = openAICompletion.usage?.prompt_tokens || 0;
              outputTokens = openAICompletion.usage?.completion_tokens || 0;
              break;

              case 'Anthropic':
              // Use streaming for long-running operations (required for operations > 10 minutes)
              const anthropicStream = await anthropic.messages.stream({
                model: model.version,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
              });

              // Collect streamed text chunks
              let anthropicText = '';
              for await (const event of anthropicStream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                  anthropicText += event.delta.text;
                }
              }

              // Get final message with usage information
              const finalMessage = await anthropicStream.finalMessage();
              modelOutputText = anthropicText;
              inputTokens = finalMessage.usage?.input_tokens || 0;
              outputTokens = finalMessage.usage?.output_tokens || 0;
              break;

              case 'Google':
              // Use the model version directly from database
              // Database stores: gemini-flash-latest (exact name as specified)
              // API will use: gemini-flash-latest (no conversion needed)
              const googleModelName = model.version;
              
              const googleModel = genAI.getGenerativeModel({ model: googleModelName });
              const googleResult = await googleModel.generateContent(prompt);
              const googleResponse = googleResult.response;

              modelOutputText = googleResponse.text();

              // Google's token counting is a bit different, might need a separate API call or careful parsing
              const googleTokenCount = await googleModel.countTokens(prompt);
              inputTokens = googleTokenCount.totalTokens || 0;
              // Output tokens might need to be estimated or calculated differently
              outputTokens = modelOutputText.split(/\s+/).length; // Basic word count as approximation
              break;

              case 'Mistral AI':
              const mistralCompletion = await mistral.chat.complete({
                model: model.version,
                messages: [{ role: 'user', content: prompt }],
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

              case 'Meta': // Assuming Llama 3 via Groq or Replicate
                // Example using Groq SDK (requires Groq model version)
                // const groqCompletion = await groq.chat.completions.create({
                //     messages: [{ role: 'user', content: prompt }],
                //     model: model.version,
                // });
                // modelOutputText = groqCompletion.choices[0]?.message?.content || '';
                // inputTokens = groqCompletion.usage?.prompt_tokens || 0;
                // outputTokens = groqCompletion.usage?.completion_tokens || 0;
                // For Replicate: need to call Replicate.run and parse
                modelOutputText = `(Llama 3 output - not implemented yet for ${model.version})`; // Placeholder
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
            cost: parseFloat(cost.toFixed(6)), // Round cost for storage
            error,
          };
        }
    });

      const results = await Promise.all(outputPromises);

      // 4. Store outputs in Supabase
      const outputsToInsert = results.map((result) => ({
        run_id: runId,
        model_id: result.model_id,
        text: result.text,
        latency_ms: result.latency_ms,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        tokens_used: result.input_tokens + result.output_tokens, // Compute total tokens
        cost: result.cost,
        error: result.error, // Store error message if present
      }));

      const { error: outputsError } = await supabase.from('outputs').insert(outputsToInsert);

      if (outputsError) {
        throw new Error(outputsError.message || 'Failed to save outputs.');
      }

      return res.status(200).json({ run_id: runId, outputs: results });
    } catch (error: any) {
      console.error('API Run Error:', error.message);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}

