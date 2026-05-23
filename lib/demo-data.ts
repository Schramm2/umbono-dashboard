export type DemoModel = {
  id: string;
  name: string;
  provider: string;
  version: string;
  max_tokens: number;
  cost_input_per_million: number;
  cost_output_per_million: number;
};

export type DemoRating = {
  criterion_id: string;
  score_value: number | boolean;
};

export const demoUser = {
  id: 'demo-user-umbono',
  email: 'demo@umbono.local',
};

export const demoProfile = {
  id: demoUser.id,
  email: demoUser.email,
  full_name: 'Portfolio Demo User',
  role: 'admin',
};

export const demoModels: DemoModel[] = [
  {
    id: 'demo-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    version: 'gpt-4o-2024-08-06',
    max_tokens: 128000,
    cost_input_per_million: 2.5,
    cost_output_per_million: 10,
  },
  {
    id: 'demo-claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    version: 'claude-3-5-sonnet-20241022',
    max_tokens: 200000,
    cost_input_per_million: 3,
    cost_output_per_million: 15,
  },
  {
    id: 'demo-gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    version: 'gemini-1.5-flash',
    max_tokens: 1000000,
    cost_input_per_million: 0.35,
    cost_output_per_million: 1.05,
  },
  {
    id: 'demo-mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    version: 'mistral-large-latest',
    max_tokens: 128000,
    cost_input_per_million: 2,
    cost_output_per_million: 6,
  },
];

export const demoCriteria = [
  { id: 'clarity', name: 'Clarity', type: 'slider', weight: 0.3 },
  { id: 'helpfulness', name: 'Helpfulness', type: 'slider', weight: 0.4 },
  { id: 'creativity', name: 'Creativity', type: 'slider', weight: 0.2 },
  { id: 'ubuntu_alignment', name: 'Ubuntu Alignment', type: 'boolean', weight: 0.5 },
];

export const demoTemplates = [
  {
    id: 'template-policy',
    title: 'Community Policy Explainer',
    description: 'Tests concise reasoning, tone, and Ubuntu-aligned guidance.',
    text: 'Explain a new community moderation policy to volunteers. Be clear, helpful, culturally sensitive, and practical.',
    created_at: '2026-05-18T09:00:00.000Z',
    updated_at: '2026-05-18T09:00:00.000Z',
  },
  {
    id: 'template-support',
    title: 'Support Triage',
    description: 'Measures customer support accuracy and next-step quality.',
    text: 'A user says their account export failed twice. Draft a support response and identify the likely next debugging steps.',
    created_at: '2026-05-17T11:30:00.000Z',
    updated_at: '2026-05-17T11:30:00.000Z',
  },
  {
    id: 'template-creative',
    title: 'Campaign Variant',
    description: 'Compares creative quality under brand constraints.',
    text: 'Write three short campaign concepts for a civic education workshop series. Keep the tone grounded and inclusive.',
    created_at: '2026-05-16T14:15:00.000Z',
    updated_at: '2026-05-16T14:15:00.000Z',
  },
];

export const demoEvalSets = [
  {
    id: 'evalset-community-safety',
    name: 'Community Safety Review',
    description: 'A curated evaluation set for policy, support, and culturally grounded responses.',
    promptCount: 3,
    default_models: ['demo-gpt-4o', 'demo-claude-sonnet', 'demo-gemini-flash'],
    default_parameters: { temperature: 0.4, max_tokens: 1200 },
    created_at: '2026-05-15T08:00:00.000Z',
    updated_at: '2026-05-18T09:00:00.000Z',
    archived: false,
  },
  {
    id: 'evalset-cost-latency',
    name: 'Cost vs Latency Sweep',
    description: 'A smaller batch for finding the best production default model.',
    promptCount: 4,
    default_models: ['demo-gemini-flash', 'demo-mistral-large'],
    default_parameters: { temperature: 0.2, max_tokens: 900 },
    created_at: '2026-05-12T10:30:00.000Z',
    updated_at: '2026-05-19T13:45:00.000Z',
    archived: false,
  },
];

export const demoLeaderboard = [
  {
    modelId: 'demo-claude-sonnet',
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    overall: 4.72,
    ubuntuPct: 0.94,
    clarity: 4.8,
    helpfulness: 4.7,
    creativity: 4.5,
    p95LatencyMs: 1920,
    costPer1k: 0.0112,
    runs: 38,
    updatedAt: '2026-05-20T16:10:00.000Z',
  },
  {
    modelId: 'demo-gpt-4o',
    model: 'GPT-4o',
    provider: 'OpenAI',
    overall: 4.61,
    ubuntuPct: 0.89,
    clarity: 4.7,
    helpfulness: 4.6,
    creativity: 4.4,
    p95LatencyMs: 1540,
    costPer1k: 0.0078,
    runs: 42,
    updatedAt: '2026-05-20T16:08:00.000Z',
  },
  {
    modelId: 'demo-gemini-flash',
    model: 'Gemini 1.5 Flash',
    provider: 'Google',
    overall: 4.18,
    ubuntuPct: 0.81,
    clarity: 4.2,
    helpfulness: 4.0,
    creativity: 4.1,
    p95LatencyMs: 740,
    costPer1k: 0.0011,
    runs: 44,
    updatedAt: '2026-05-20T15:44:00.000Z',
  },
  {
    modelId: 'demo-mistral-large',
    model: 'Mistral Large',
    provider: 'Mistral AI',
    overall: 4.02,
    ubuntuPct: 0.76,
    clarity: 4.1,
    helpfulness: 3.9,
    creativity: 4.2,
    p95LatencyMs: 1280,
    costPer1k: 0.0046,
    runs: 31,
    updatedAt: '2026-05-19T12:05:00.000Z',
  },
];

const demoResponses: Record<string, string> = {
  'demo-gpt-4o':
    'I would frame the policy as a practical agreement: explain what changed, why it protects the community, and how volunteers can apply it consistently. The key is to give examples, escalation paths, and language that keeps dignity intact.',
  'demo-claude-sonnet':
    'Start with the human purpose behind the rule, then translate it into repeatable moderation decisions. I would include a short checklist, edge-case guidance, and a reminder that Ubuntu alignment means accountability without humiliation.',
  'demo-gemini-flash':
    'Here is a quick volunteer-ready version: name the behavior, explain the impact, give the next action, and document the decision. Use consistent tags so future reviews can be audited.',
  'demo-mistral-large':
    'A strong rollout should pair the policy with examples, reviewer notes, and clear appeal routes. That makes the process transparent without slowing down urgent moderation decisions.',
};

function stableNumber(input: string, min: number, max: number) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 100000;
  }
  return min + (hash % (max - min + 1));
}

export function createDemoRun(prompt: string, modelIds: string[]) {
  const selectedModels = demoModels.filter((model) => modelIds.includes(model.id));
  const runId = `demo-run-${Date.now()}`;

  return {
    run_id: runId,
    outputs: selectedModels.map((model) => {
      const inputTokens = Math.max(18, Math.round(prompt.length / 4));
      const outputTokens = stableNumber(`${prompt}-${model.id}-tokens`, 92, 176);
      const latency_ms = stableNumber(`${prompt}-${model.id}-latency`, 620, 2140);
      const cost =
        (inputTokens / 1_000_000) * model.cost_input_per_million +
        (outputTokens / 1_000_000) * model.cost_output_per_million;

      return {
        id: `${runId}-${model.id}`,
        model_id: model.id,
        model_name: model.name,
        text: demoResponses[model.id],
        latency_ms,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        tokens_used: inputTokens + outputTokens,
        cost: Number(cost.toFixed(6)),
        error: null,
        computed_score: null,
      };
    }),
  };
}

export function scoreDemoRatings(ratings: DemoRating[]) {
  const weights: Record<string, number> = {
    clarity: 0.3,
    helpfulness: 0.4,
    creativity: 0.2,
    ubuntu_alignment: 0.5,
  };

  const weightedScore = ratings.reduce((total, rating) => {
    const weight = weights[rating.criterion_id] || 0;
    const value = typeof rating.score_value === 'boolean'
      ? rating.score_value ? 1 : 0
      : Number(rating.score_value);
    return total + value * weight;
  }, 0);

  return Number(weightedScore.toFixed(2));
}

