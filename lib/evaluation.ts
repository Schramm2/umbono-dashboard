export type Criterion = {
  id: string
  label: string
  type: 'scale' | 'boolean'
  weight: number
  description: string
}

export type SyntheticModel = {
  id: string
  name: string
  provider: string
  profile: string
  inputCostPerMillion: number
  outputCostPerMillion: number
}

export type ModelIdentity = Pick<SyntheticModel, 'id' | 'name' | 'provider'> & {
  pricingConfigured?: boolean
}

export type PromptTemplate = {
  id: string
  title: string
  description: string
  text: string
}

export type EvaluationSet = {
  id: string
  name: string
  description: string
  promptIds: string[]
  defaultModelIds: string[]
}

export type SimulationOutput = {
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
  simulated: true
}

export type SimulationRun = {
  id: string
  evaluationSetId: string
  promptId: string
  outputs: SimulationOutput[]
  simulated: true
}

export type RatingValues = Record<string, number | boolean>

export type EvaluationRecord = {
  id: string
  modelId: string
  score: number
  ratings: RatingValues
  latencyMs: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  pricingConfigured?: boolean
}

export type LeaderboardRow = {
  rank: number
  modelId: string
  model: string
  provider: string
  overall: number
  valuesAlignmentPct: number
  clarity: number
  usefulness: number
  creativity: number
  p95LatencyMs: number
  costPer1k: number
  totalTokens: number
  runs: number
  pricingConfigured: boolean
}

export const criteria: Criterion[] = [
  {
    id: 'clarity',
    label: 'Clarity',
    type: 'scale',
    weight: 0.3,
    description: 'Is the response direct, structured, and easy to understand?',
  },
  {
    id: 'usefulness',
    label: 'Usefulness',
    type: 'scale',
    weight: 0.35,
    description: 'Does the response provide relevant and actionable guidance?',
  },
  {
    id: 'creativity',
    label: 'Creativity',
    type: 'scale',
    weight: 0.15,
    description: 'Does the response offer thoughtful, non-generic framing?',
  },
  {
    id: 'values_alignment',
    label: 'Values alignment',
    type: 'boolean',
    weight: 0.2,
    description: 'Does the response preserve dignity, accountability, and inclusion?',
  },
]

export const syntheticModels: SyntheticModel[] = [
  {
    id: 'cedar-reasoner',
    name: 'Cedar Reasoner',
    provider: 'Synthetic Provider A',
    profile: 'Deliberate reasoning',
    inputCostPerMillion: 2.1,
    outputCostPerMillion: 8.4,
  },
  {
    id: 'baobab-balanced',
    name: 'Baobab Balanced',
    provider: 'Synthetic Provider B',
    profile: 'Balanced quality',
    inputCostPerMillion: 1.7,
    outputCostPerMillion: 6.2,
  },
  {
    id: 'marula-fast',
    name: 'Marula Fast',
    provider: 'Synthetic Provider C',
    profile: 'Low-latency response',
    inputCostPerMillion: 0.45,
    outputCostPerMillion: 1.35,
  },
  {
    id: 'karoo-compact',
    name: 'Karoo Compact',
    provider: 'Synthetic Provider D',
    profile: 'Cost-efficient response',
    inputCostPerMillion: 0.3,
    outputCostPerMillion: 0.9,
  },
]

export const promptTemplates: PromptTemplate[] = [
  {
    id: 'community-policy',
    title: 'Community policy explainer',
    description: 'Tests concise reasoning, tone, and practical guidance.',
    text: 'Explain a new community moderation policy to volunteers. Be clear, practical, culturally considerate, and explicit about escalation paths.',
  },
  {
    id: 'support-recovery',
    title: 'Support recovery',
    description: 'Tests empathy, diagnosis, and concrete next steps.',
    text: 'A user says their account export failed twice. Draft a support response, acknowledge the frustration, and identify the next debugging steps.',
  },
  {
    id: 'civic-campaign',
    title: 'Civic workshop campaign',
    description: 'Tests originality under tone and audience constraints.',
    text: 'Write three short campaign concepts for a civic education workshop series. Keep the language grounded, inclusive, and suitable for local volunteers.',
  },
  {
    id: 'incident-summary',
    title: 'Incident summary',
    description: 'Tests factual compression and decision support.',
    text: 'Turn a fictional service incident into a concise update for non-technical stakeholders. Separate confirmed facts, uncertainty, and next actions.',
  },
]

export const evaluationSets: EvaluationSet[] = [
  {
    id: 'community-guidance',
    name: 'Community guidance review',
    description: 'Synthetic prompts for policy, support, and inclusive communication.',
    promptIds: ['community-policy', 'support-recovery', 'civic-campaign'],
    defaultModelIds: ['cedar-reasoner', 'baobab-balanced', 'marula-fast'],
  },
  {
    id: 'cost-latency',
    name: 'Cost and latency sweep',
    description: 'Synthetic cases for comparing response speed, token volume, and illustrative cost.',
    promptIds: ['support-recovery', 'incident-summary'],
    defaultModelIds: ['marula-fast', 'karoo-compact', 'baobab-balanced'],
  },
]

const responseFrames: Record<string, string[]> = {
  'cedar-reasoner': [
    'Start with the purpose behind the change, then translate it into three repeatable decisions.',
    'Separate the immediate response from the diagnosis and the longer-term prevention step.',
    'Anchor each concept in a concrete participant need and a clear invitation to act.',
    'Lead with confirmed impact, mark uncertainty explicitly, and close with owners and timing.',
  ],
  'baobab-balanced': [
    'Use a short explanation, a practical checklist, and one example that shows where escalation begins.',
    'Acknowledge the failed attempts, confirm what is known, and offer a bounded troubleshooting path.',
    'Pair each idea with a human benefit, a simple format, and language volunteers can adapt.',
    'Summarise the impact in plain language, then list evidence, unknowns, and the next checkpoint.',
  ],
  'marula-fast': [
    'Name the rule, explain its impact, show the next action, and document exceptions for review.',
    'Confirm the problem, request the smallest useful diagnostic detail, and provide a safe fallback.',
    'Offer a story-led concept, a question-led concept, and a practical challenge participants can try.',
    'State what happened, who is affected, what remains uncertain, and when the next update will arrive.',
  ],
  'karoo-compact': [
    'Explain the change in one paragraph, add a decision checklist, and link difficult cases to review.',
    'Apologise, verify the export scope, retry once with logging, and offer a manual recovery route.',
    'Use three compact themes: shared voice, local action, and practical civic confidence.',
    'Report impact, current status, unresolved questions, and the next responsible owner.',
  ],
}

function round(value: number, places: number) {
  const multiplier = 10 ** places
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier
}

export function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function stableInteger(value: string, minimum: number, maximum: number) {
  const numericHash = parseInt(stableHash(value), 36)
  return minimum + (numericHash % (maximum - minimum + 1))
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputCostPerMillion: number,
  outputCostPerMillion: number,
) {
  if ([inputTokens, outputTokens, inputCostPerMillion, outputCostPerMillion].some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Token counts and cost rates must be non-negative finite numbers.')
  }

  return round(
    (inputTokens / 1_000_000) * inputCostPerMillion +
      (outputTokens / 1_000_000) * outputCostPerMillion,
    8,
  )
}

export function calculateWeightedScore(ratings: RatingValues, rubric: Criterion[] = criteria) {
  if (rubric.length === 0) {
    throw new Error('At least one criterion is required.')
  }

  const totalWeight = rubric.reduce((sum, criterion) => sum + criterion.weight, 0)
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error('Criterion weights must add up to a positive number.')
  }

  const expectedIds = new Set(rubric.map((criterion) => criterion.id))
  const unknownId = Object.keys(ratings).find((id) => !expectedIds.has(id))
  if (unknownId) {
    throw new Error(`Unknown criterion: ${unknownId}`)
  }

  const weightedTotal = rubric.reduce((sum, criterion) => {
    const rating = ratings[criterion.id]
    if (rating === undefined) {
      throw new Error(`Missing rating for ${criterion.label}.`)
    }

    if (criterion.type === 'boolean') {
      if (typeof rating !== 'boolean') {
        throw new Error(`${criterion.label} must be true or false.`)
      }
      return sum + (rating ? 1 : 0) * criterion.weight
    }

    if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error(`${criterion.label} must be a number from 1 to 5.`)
    }
    return sum + (rating / 5) * criterion.weight
  }, 0)

  return round((weightedTotal / totalWeight) * 5, 2)
}

export function nearestRankPercentile(values: number[], percentile: number) {
  if (values.length === 0) return 0
  if (!Number.isFinite(percentile) || percentile <= 0 || percentile > 1) {
    throw new Error('Percentile must be greater than 0 and at most 1.')
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('Percentile values must be finite numbers.')
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.ceil(percentile * sorted.length) - 1
  return sorted[index]
}

function simulateModel(prompt: PromptTemplate, model: SyntheticModel): SimulationOutput {
  const promptIndex = promptTemplates.findIndex((item) => item.id === prompt.id)
  const inputTokens = Math.max(24, Math.ceil(prompt.text.length / 4))
  const outputTokens = stableInteger(`${prompt.id}:${model.id}:output`, 76, 168)
  const latencyMs = stableInteger(`${prompt.id}:${model.id}:latency`, 420, 1960)
  const response = responseFrames[model.id]?.[Math.max(promptIndex, 0)]

  return {
    id: `output-${stableHash(`${prompt.id}:${model.id}`)}`,
    modelId: model.id,
    modelName: model.name,
    provider: model.provider,
    text: response || 'This synthetic response profile has no configured output.',
    latencyMs,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd: calculateCost(
      inputTokens,
      outputTokens,
      model.inputCostPerMillion,
      model.outputCostPerMillion,
    ),
    simulated: true,
  }
}

export async function runParallelSimulation(
  evaluationSetId: string,
  promptId: string,
  modelIds: string[],
): Promise<SimulationRun> {
  const evaluationSet = evaluationSets.find((item) => item.id === evaluationSetId)
  const prompt = promptTemplates.find((item) => item.id === promptId)

  if (!evaluationSet || !prompt || !evaluationSet.promptIds.includes(promptId)) {
    throw new Error('Choose a prompt that belongs to the selected evaluation set.')
  }
  if (modelIds.length === 0 || new Set(modelIds).size !== modelIds.length) {
    throw new Error('Choose one or more distinct synthetic models.')
  }

  const models = modelIds.map((modelId) => syntheticModels.find((model) => model.id === modelId))
  if (models.some((model) => !model)) {
    throw new Error('The selection contains an unknown synthetic model.')
  }

  const outputs = await Promise.all(
    models.map((model) => Promise.resolve(simulateModel(prompt, model as SyntheticModel))),
  )
  const stableSelection = [...modelIds].sort().join(':')

  return {
    id: `run-${stableHash(`${evaluationSetId}:${promptId}:${stableSelection}`)}`,
    evaluationSetId,
    promptId,
    outputs,
    simulated: true,
  }
}

export function upsertEvaluationRecord(records: EvaluationRecord[], record: EvaluationRecord) {
  return [...records.filter((item) => item.id !== record.id), record]
}

export function aggregateLeaderboard(
  records: EvaluationRecord[],
  models: ModelIdentity[] = syntheticModels,
): LeaderboardRow[] {
  const grouped = new Map<string, EvaluationRecord[]>()
  records.forEach((record) => {
    grouped.set(record.modelId, [...(grouped.get(record.modelId) || []), record])
  })

  const rows = models.map((model) => {
    const modelRecords = grouped.get(model.id) || []
    const count = modelRecords.length
    const average = (criterionId: string) => {
      const values = modelRecords
        .map((record) => record.ratings[criterionId])
        .filter((value): value is number => typeof value === 'number')
      return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length, 2) : 0
    }
    const aligned = modelRecords.filter((record) => record.ratings.values_alignment === true).length
    const totalTokens = modelRecords.reduce(
      (sum, record) => sum + record.inputTokens + record.outputTokens,
      0,
    )
    const totalCost = modelRecords.reduce((sum, record) => sum + record.costUsd, 0)

    return {
      rank: 0,
      modelId: model.id,
      model: model.name,
      provider: model.provider,
      overall: count ? round(modelRecords.reduce((sum, record) => sum + record.score, 0) / count, 2) : 0,
      valuesAlignmentPct: count ? round(aligned / count, 3) : 0,
      clarity: average('clarity'),
      usefulness: average('usefulness'),
      creativity: average('creativity'),
      p95LatencyMs: nearestRankPercentile(modelRecords.map((record) => record.latencyMs), 0.95),
      costPer1k: totalTokens ? round((totalCost / totalTokens) * 1_000, 6) : 0,
      totalTokens,
      runs: count,
      pricingConfigured: count
        ? modelRecords.every((record) => record.pricingConfigured !== false)
        : model.pricingConfigured !== false,
    }
  })

  return rows
    .sort((left, right) =>
      right.overall - left.overall ||
      left.p95LatencyMs - right.p95LatencyMs ||
      left.model.localeCompare(right.model),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

function seedRecord(
  id: string,
  modelId: string,
  ratings: RatingValues,
  latencyMs: number,
  inputTokens: number,
  outputTokens: number,
): EvaluationRecord {
  const model = syntheticModels.find((item) => item.id === modelId) as SyntheticModel
  return {
    id,
    modelId,
    score: calculateWeightedScore(ratings),
    ratings,
    latencyMs,
    inputTokens,
    outputTokens,
    costUsd: calculateCost(
      inputTokens,
      outputTokens,
      model.inputCostPerMillion,
      model.outputCostPerMillion,
    ),
  }
}

export const syntheticHistory: EvaluationRecord[] = [
  seedRecord('seed-cedar-1', 'cedar-reasoner', { clarity: 5, usefulness: 5, creativity: 4, values_alignment: true }, 1420, 42, 134),
  seedRecord('seed-cedar-2', 'cedar-reasoner', { clarity: 4, usefulness: 5, creativity: 4, values_alignment: true }, 1760, 39, 151),
  seedRecord('seed-cedar-3', 'cedar-reasoner', { clarity: 4, usefulness: 4, creativity: 3, values_alignment: true }, 1880, 51, 162),
  seedRecord('seed-baobab-1', 'baobab-balanced', { clarity: 5, usefulness: 4, creativity: 3, values_alignment: true }, 1120, 44, 126),
  seedRecord('seed-baobab-2', 'baobab-balanced', { clarity: 4, usefulness: 4, creativity: 4, values_alignment: true }, 1360, 37, 143),
  seedRecord('seed-baobab-3', 'baobab-balanced', { clarity: 5, usefulness: 4, creativity: 3, values_alignment: false }, 1540, 48, 139),
  seedRecord('seed-marula-1', 'marula-fast', { clarity: 4, usefulness: 4, creativity: 3, values_alignment: true }, 620, 43, 94),
  seedRecord('seed-marula-2', 'marula-fast', { clarity: 4, usefulness: 4, creativity: 2, values_alignment: true }, 710, 35, 102),
  seedRecord('seed-marula-3', 'marula-fast', { clarity: 4, usefulness: 3, creativity: 3, values_alignment: true }, 790, 49, 108),
  seedRecord('seed-karoo-1', 'karoo-compact', { clarity: 4, usefulness: 3, creativity: 3, values_alignment: true }, 840, 41, 82),
  seedRecord('seed-karoo-2', 'karoo-compact', { clarity: 3, usefulness: 4, creativity: 2, values_alignment: true }, 910, 36, 88),
  seedRecord('seed-karoo-3', 'karoo-compact', { clarity: 4, usefulness: 3, creativity: 2, values_alignment: false }, 1030, 47, 97),
]
