export type ProviderModel = {
  id: string
  label: string
  inputCostPerMillion: number | null
  outputCostPerMillion: number | null
}

export type ProviderConfig = {
  configured: boolean
  apiKey: string
  baseUrl: string
  models: ProviderModel[]
  maxTokens: number
  requestTimeoutMs: number
  siteUrl?: string
  appName: string
  productionLiveEnabled: boolean
}

export type ProviderOutput = {
  id: string
  modelId: string
  modelName: string
  provider: string
  text: string
  latencyMs: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  pricingConfigured: boolean
  simulated: false
  error?: string
}

export type ProviderRun = {
  id: string
  evaluationSetId: string
  promptId: string
  outputs: ProviderOutput[]
  simulated: false
}

type Environment = Record<string, string | undefined>

type PricingMap = Record<string, { input?: number; output?: number }>

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parsePricing(raw: string | undefined): PricingMap {
  if (!raw) return {}

  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return value as PricingMap
  } catch {
    return {}
  }
}

function titleFromModelId(modelId: string) {
  const shortName = modelId.split('/').at(-1) || modelId
  return shortName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getProviderConfig(env: Environment = process.env): ProviderConfig {
  const apiKey = env.UMBONO_API_KEY?.trim() || ''
  const modelIds = Array.from(new Set((env.UMBONO_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)))
  const pricing = parsePricing(env.UMBONO_MODEL_PRICING)
  const baseUrl = (env.UMBONO_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const productionLiveEnabled = env.NODE_ENV !== 'production' || env.UMBONO_ALLOW_LIVE_IN_PRODUCTION === 'true'
  const forceDemo = env.UMBONO_FORCE_DEMO === 'true'

  return {
    configured: Boolean(apiKey && modelIds.length && productionLiveEnabled && !forceDemo),
    apiKey,
    baseUrl,
    models: modelIds.map((id) => ({
      id,
      label: titleFromModelId(id),
      inputCostPerMillion: Number.isFinite(pricing[id]?.input) ? Number(pricing[id].input) : null,
      outputCostPerMillion: Number.isFinite(pricing[id]?.output) ? Number(pricing[id].output) : null,
    })),
    maxTokens: positiveInteger(env.UMBONO_MAX_TOKENS, 800),
    requestTimeoutMs: positiveInteger(env.UMBONO_REQUEST_TIMEOUT_MS, 45_000),
    siteUrl: env.UMBONO_SITE_URL?.trim() || undefined,
    appName: env.UMBONO_APP_NAME?.trim() || 'Umbono',
    productionLiveEnabled,
  }
}

function calculateProviderCost(model: ProviderModel, inputTokens: number, outputTokens: number) {
  if (model.inputCostPerMillion === null || model.outputCostPerMillion === null) return 0
  return Number((
    (inputTokens / 1_000_000) * model.inputCostPerMillion
    + (outputTokens / 1_000_000) * model.outputCostPerMillion
  ).toFixed(8))
}

function extractText(content: unknown) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const candidate = part as { text?: unknown }
      return typeof candidate.text === 'string' ? candidate.text : ''
    })
    .filter(Boolean)
    .join('\n')
}

function providerName(baseUrl: string) {
  try {
    return new URL(baseUrl).hostname
  } catch {
    return 'OpenAI-compatible provider'
  }
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'The provider request timed out.'
    return error.message.slice(0, 240)
  }
  return 'The provider request failed.'
}

export async function runProviderComparison(
  input: {
    prompt: string
    modelIds: string[]
    evaluationSetId?: string
    promptId?: string
  },
  config: ProviderConfig = getProviderConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<ProviderRun> {
  const prompt = input.prompt.trim()
  if (!config.configured) throw new Error('Live mode is not configured on the server.')
  if (!prompt || prompt.length > 20_000) throw new Error('Prompt must contain between 1 and 20,000 characters.')
  if (!Array.isArray(input.modelIds) || input.modelIds.length < 1 || input.modelIds.length > 4) {
    throw new Error('Choose between 1 and 4 models.')
  }

  const uniqueModelIds = Array.from(new Set(input.modelIds))
  const availableModels = new Map(config.models.map((model) => [model.id, model]))
  const selectedModels = uniqueModelIds.map((id) => availableModels.get(id)).filter(Boolean) as ProviderModel[]
  if (selectedModels.length !== uniqueModelIds.length) throw new Error('One or more selected models are not configured.')

  const outputs = await Promise.all(selectedModels.map(async (model): Promise<ProviderOutput> => {
    const startedAt = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      }
      if (config.siteUrl) headers['HTTP-Referer'] = config.siteUrl
      if (config.appName) headers['X-Title'] = config.appName

      const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Provider returned ${response.status}.`)
      }

      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: unknown } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
      }
      const text = extractText(payload.choices?.[0]?.message?.content)
      if (!text) throw new Error('Provider returned an empty response.')

      const inputTokens = Number(payload.usage?.prompt_tokens) || 0
      const outputTokens = Number(payload.usage?.completion_tokens) || 0
      const totalTokens = Number(payload.usage?.total_tokens) || inputTokens + outputTokens

      return {
        id: `${Date.now()}-${model.id}`,
        modelId: model.id,
        modelName: model.label,
        provider: providerName(config.baseUrl),
        text,
        latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
        inputTokens,
        outputTokens,
        totalTokens,
        costUsd: calculateProviderCost(model, inputTokens, outputTokens),
        pricingConfigured: model.inputCostPerMillion !== null && model.outputCostPerMillion !== null,
        simulated: false,
      }
    } catch (error) {
      return {
        id: `${Date.now()}-${model.id}`,
        modelId: model.id,
        modelName: model.label,
        provider: providerName(config.baseUrl),
        text: '',
        latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        pricingConfigured: false,
        simulated: false,
        error: safeErrorMessage(error),
      }
    } finally {
      clearTimeout(timeout)
    }
  }))

  return {
    id: crypto.randomUUID(),
    evaluationSetId: input.evaluationSetId || 'live-comparison',
    promptId: input.promptId || 'custom-prompt',
    outputs,
    simulated: false,
  }
}
