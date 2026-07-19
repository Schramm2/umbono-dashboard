import test from 'node:test'
import assert from 'node:assert/strict'

import { getProviderConfig, runProviderComparison } from '../lib/provider'

test('provider config fails closed until key and model allowlist are present', () => {
  assert.equal(getProviderConfig({}).configured, false)
  assert.equal(getProviderConfig({ UMBONO_API_KEY: 'secret' }).configured, false)
  assert.equal(getProviderConfig({ UMBONO_MODELS: 'model-a' }).configured, false)

  const config = getProviderConfig({
    UMBONO_API_KEY: 'secret',
    UMBONO_BASE_URL: 'https://provider.example/v1/',
    UMBONO_MODELS: 'team/model-a, model-b, team/model-a',
    UMBONO_MODEL_PRICING: '{"team/model-a":{"input":2,"output":8}}',
  })

  assert.equal(config.configured, true)
  assert.equal(config.baseUrl, 'https://provider.example/v1')
  assert.equal(config.models[0].label, 'Model A')
  assert.equal(config.models[0].inputCostPerMillion, 2)
  assert.equal(config.models[1].outputCostPerMillion, null)
})

test('provider config requires an explicit production live-mode opt-in', () => {
  const production = {
    NODE_ENV: 'production',
    UMBONO_API_KEY: 'secret',
    UMBONO_MODELS: 'model-a',
  }

  assert.equal(getProviderConfig(production).configured, false)
  assert.equal(getProviderConfig({ ...production, UMBONO_ALLOW_LIVE_IN_PRODUCTION: 'true' }).configured, true)
  assert.equal(getProviderConfig({
    ...production,
    UMBONO_ALLOW_LIVE_IN_PRODUCTION: 'true',
    UMBONO_FORCE_DEMO: 'true',
  }).configured, false)
})

test('provider comparison normalizes output, usage, latency, and configured cost', async () => {
  const config = getProviderConfig({
    UMBONO_API_KEY: 'secret',
    UMBONO_BASE_URL: 'https://provider.example/v1',
    UMBONO_MODELS: 'model-a,model-b',
    UMBONO_MODEL_PRICING: '{"model-a":{"input":2,"output":8}}',
  })
  const requests: Array<{ url: string; body: Record<string, unknown>; authorization: string | null }> = []
  const mockFetch: typeof fetch = async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      authorization: new Headers(init?.headers).get('authorization'),
    })
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'A normalized model response.' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const run = await runProviderComparison({
    prompt: 'Compare this response.',
    modelIds: ['model-a', 'model-b'],
  }, config, mockFetch)

  assert.equal(run.simulated, false)
  assert.equal(run.outputs.length, 2)
  assert.equal(run.outputs[0].text, 'A normalized model response.')
  assert.equal(run.outputs[0].totalTokens, 150)
  assert.equal(run.outputs[0].costUsd, 0.0006)
  assert.equal(run.outputs[0].pricingConfigured, true)
  assert.equal(run.outputs[1].pricingConfigured, false)
  assert.equal(requests[0].url, 'https://provider.example/v1/chat/completions')
  assert.equal(requests[0].authorization, 'Bearer secret')
  assert.equal(requests[0].body.model, 'model-a')
})

test('provider comparison rejects unknown models and keeps per-model errors isolated', async () => {
  const config = getProviderConfig({
    UMBONO_API_KEY: 'secret',
    UMBONO_MODELS: 'model-a,model-b',
  })

  await assert.rejects(
    runProviderComparison({ prompt: 'Prompt', modelIds: ['unknown'] }, config),
    /not configured/,
  )

  const mockFetch: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { model: string }
    if (body.model === 'model-b') return new Response('quota exceeded', { status: 429 })
    return new Response(JSON.stringify({
      choices: [{ message: { content: [{ text: 'Successful text part.' }] } }],
      usage: {},
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const run = await runProviderComparison({ prompt: 'Prompt', modelIds: ['model-a', 'model-b'] }, config, mockFetch)
  assert.equal(run.outputs[0].text, 'Successful text part.')
  assert.match(run.outputs[1].error || '', /429/)
})
