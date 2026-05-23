import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEvent, useMemo, useState } from 'react'
import { demoAuthToken } from '../lib/demo-mode'
import { demoLeaderboard, demoModels, demoTemplates } from '../lib/demo-data'

type DemoOutput = {
  id?: string
  model_id: string
  model_name: string
  text: string
  latency_ms: number
  input_tokens: number
  output_tokens: number
  tokens_used: number
  cost: number
  error: string | null
  computed_score?: number | null
}

const defaultPrompt = demoTemplates[0].text

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'demo-gpt-4o',
    'demo-claude-sonnet',
    'demo-gemini-flash',
  ])
  const [outputs, setOutputs] = useState<DemoOutput[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [activeOutput, setActiveOutput] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Ready to run a simulated multi-model evaluation.')
  const [clarityRating, setClarityRating] = useState(5)
  const [helpfulnessRating, setHelpfulnessRating] = useState(4)
  const [creativityRating, setCreativityRating] = useState(4)
  const [ubuntuAlignment, setUbuntuAlignment] = useState(true)

  const selectedModelNames = useMemo(
    () => demoModels.filter((model) => selectedModels.includes(model.id)).map((model) => model.name),
    [selectedModels]
  )

  async function runDemo(event?: FormEvent) {
    event?.preventDefault()
    if (selectedModels.length === 0) {
      setStatus('Select at least one model before running the demo.')
      return
    }

    setIsRunning(true)
    setScore(null)
    setStatus('Simulating provider calls, token accounting, latency capture, and persistence...')

    const response = await fetch('/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoAuthToken}`,
      },
      body: JSON.stringify({
        prompt,
        model_ids: selectedModels,
      }),
    })

    const data = await response.json()
    setOutputs(data.outputs || [])
    setRunId(data.run_id || null)
    setActiveOutput(data.outputs?.[0]?.model_id || null)
    setStatus('Demo run complete. Results are simulated and safe for public deployment.')
    setIsRunning(false)
  }

  async function scoreActiveOutput() {
    const outputId = activeOutput || outputs[0]?.model_id
    if (!runId || !outputId) {
      setStatus('Run the demo first, then score one of the outputs.')
      return
    }

    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoAuthToken}`,
      },
      body: JSON.stringify({
        run_id: runId,
        output_id: outputId,
        ratings: [
          { criterion_id: 'clarity', score_value: clarityRating },
          { criterion_id: 'helpfulness', score_value: helpfulnessRating },
          { criterion_id: 'creativity', score_value: creativityRating },
          { criterion_id: 'ubuntu_alignment', score_value: ubuntuAlignment },
        ],
      }),
    })

    const data = await response.json()
    setScore(data.score)
    setStatus('Evaluation saved to the demo response only. No database write or paid API call happened.')
  }

  function toggleModel(modelId: string) {
    setSelectedModels((current) =>
      current.includes(modelId)
        ? current.filter((id) => id !== modelId)
        : [...current, modelId]
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#171717]">
      <Head>
        <title>Umbono Demo - AI Evaluation Dashboard</title>
        <meta
          name="description"
          content="Portfolio demo of Umbono, a multi-provider AI evaluation dashboard with simulated providers and demo data."
        />
      </Head>

      <header className="sticky top-0 z-20 border-b border-[#d8ded5] bg-[#f7f8f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <a href="#top" className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1d4332]">
            Umbono
          </a>
          <nav className="hidden items-center gap-6 text-sm text-[#465149] md:flex">
            <a href="#demo" className="hover:text-[#171717]">Demo</a>
            <a href="#leaderboard" className="hover:text-[#171717]">Leaderboard</a>
            <a href="#architecture" className="hover:text-[#171717]">Architecture</a>
            <a href="#deploy" className="hover:text-[#171717]">Deploy</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="border-b border-[#d8ded5]">
          <div className="mx-auto grid min-h-[calc(100svh-57px)] max-w-7xl grid-cols-1 items-center gap-10 px-5 py-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-2xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#9b4d23]">
                Portfolio-ready interactive demo
              </p>
              <h1 className="text-5xl font-semibold leading-[1.02] text-[#111111] md:text-7xl">
                Umbono AI Evaluation Dashboard
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#465149]">
                Compare model quality, latency, cost, and Ubuntu-aligned response behavior across providers without using production data, secrets, or paid AI APIs.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#demo"
                  className="rounded-md bg-[#1d4332] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#163629]"
                >
                  Start Demo
                </a>
                <a
                  href="#architecture"
                  className="rounded-md border border-[#aab6a8] px-5 py-3 text-sm font-semibold text-[#1d4332] transition hover:border-[#1d4332]"
                >
                  How It Works
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-lg border border-[#c8d0c5] bg-[#ffffff] shadow-xl">
                <div className="flex items-center justify-between border-b border-[#dde4da] px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6b7469]">Live evaluation run</p>
                    <p className="mt-1 font-semibold">Community Safety Review</p>
                  </div>
                  <span className="rounded-full bg-[#e5f3ea] px-3 py-1 text-xs font-semibold text-[#1d4332]">
                    Demo Mode
                  </span>
                </div>
                <div className="grid grid-cols-4 border-b border-[#dde4da] text-sm">
                  {demoLeaderboard.map((row, index) => (
                    <div key={row.modelId} className="border-r border-[#dde4da] px-4 py-5 last:border-r-0">
                      <p className="text-xs text-[#6b7469]">#{index + 1}</p>
                      <p className="mt-2 min-h-[40px] font-semibold leading-5">{row.model}</p>
                      <div className="mt-5 h-28 overflow-hidden rounded bg-[#eef2eb]">
                        <div
                          className="h-full bg-[#1d4332]"
                          style={{ transform: `translateY(${100 - row.overall * 18}%)` }}
                        />
                      </div>
                      <p className="mt-3 text-2xl font-semibold">{row.overall}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="border-b border-[#dde4da] p-5 md:border-b-0 md:border-r">
                    <p className="text-sm font-semibold">Weighted scoring pipeline</p>
                    <div className="mt-4 space-y-3">
                      {['Prompt template', 'Parallel provider execution', 'Human rating criteria', 'Leaderboard aggregation'].map((item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f2eadf] text-xs font-semibold text-[#9b4d23]">
                            {index + 1}
                          </span>
                          <span className="text-sm text-[#465149]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold">Demo safeguards</p>
                    <p className="mt-4 text-sm leading-6 text-[#465149]">
                      Fake auth, seeded data, simulated provider outputs, local scoring, and no destructive writes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="border-b border-[#d8ded5] bg-[#ffffff]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[360px_1fr]">
            <aside>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b4d23]">Start Demo</p>
              <h2 className="mt-3 text-3xl font-semibold">Run a safe model comparison</h2>
              <p className="mt-4 leading-7 text-[#465149]">
                The flow mirrors production: choose providers, submit a prompt, compare outputs, then score one response against weighted criteria.
              </p>
              <div className="mt-6 rounded-md border border-[#d8ded5] bg-[#f7f8f5] p-4 text-sm text-[#465149]">
                {status}
              </div>
            </aside>

            <div className="grid gap-6">
              <form onSubmit={runDemo} className="rounded-lg border border-[#d8ded5] bg-white p-5">
                <label htmlFor="prompt" className="text-sm font-semibold">Evaluation prompt</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="mt-3 min-h-[132px] w-full resize-y rounded-md border border-[#c8d0c5] bg-[#ffffff] p-4 text-sm leading-6 outline-none transition focus:border-[#1d4332] focus:ring-2 focus:ring-[#1d4332]/20"
                />

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {demoModels.map((model) => {
                    const active = selectedModels.includes(model.id)
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => toggleModel(model.id)}
                        className={`rounded-md border p-4 text-left transition ${
                          active
                            ? 'border-[#1d4332] bg-[#eef6f0]'
                            : 'border-[#d8ded5] bg-white hover:border-[#9b4d23]'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-[0.14em] text-[#6b7469]">{model.provider}</span>
                        <span className="mt-2 block font-semibold">{model.name}</span>
                        <span className="mt-3 block text-xs text-[#465149]">
                          ${model.cost_output_per_million}/M output tokens
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[#465149]">
                    Selected: {selectedModelNames.join(', ') || 'none'}
                  </p>
                  <button
                    type="submit"
                    disabled={isRunning}
                    className="rounded-md bg-[#1d4332] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#163629] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunning ? 'Running...' : 'Run Evaluation'}
                  </button>
                </div>
              </form>

              <div className="grid gap-4 lg:grid-cols-3">
                {(outputs.length > 0 ? outputs : []).map((output) => (
                  <button
                    key={output.model_id}
                    type="button"
                    onClick={() => setActiveOutput(output.model_id)}
                    className={`rounded-lg border bg-white p-5 text-left transition ${
                      activeOutput === output.model_id ? 'border-[#1d4332]' : 'border-[#d8ded5] hover:border-[#9b4d23]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{output.model_name}</p>
                        <p className="mt-1 text-xs text-[#6b7469]">{output.latency_ms} ms p95-style sample</p>
                      </div>
                      <span className="rounded bg-[#eef2eb] px-2 py-1 text-xs text-[#465149]">
                        ${output.cost.toFixed(6)}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-5 text-sm leading-6 text-[#465149]">{output.text}</p>
                  </button>
                ))}
              </div>

              {outputs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#c8d0c5] bg-white p-8 text-center">
                  <p className="font-semibold">No run yet</p>
                  <p className="mt-2 text-sm text-[#465149]">
                    Start the demo to generate seeded provider outputs with realistic latency, cost, and token metadata.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-[#d8ded5] bg-white p-5">
                  <h3 className="text-sm font-semibold text-[#111111]">Interactive Response Evaluator</h3>
                  <p className="mt-1 text-xs text-[#465149]">
                    Rate the active response (<strong>{outputs.find(o => o.model_id === activeOutput)?.model_name || 'Selected Model'}</strong>) against our weighted criteria:
                  </p>
                  
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Clarity Slider */}
                    <div>
                      <label htmlFor="clarity-rating" className="flex justify-between text-xs font-medium text-[#465149]">
                        <span>Clarity (30% weight)</span>
                        <span className="font-semibold text-[#1d4332]">{clarityRating}/5</span>
                      </label>
                      <input
                        id="clarity-rating"
                        type="range"
                        min="1"
                        max="5"
                        value={clarityRating}
                        onChange={(e) => setClarityRating(Number(e.target.value))}
                        className="mt-2 h-1.5 w-full cursor-pointer rounded-lg bg-[#eef2eb] accent-[#1d4332]"
                      />
                    </div>

                    {/* Helpfulness Slider */}
                    <div>
                      <label htmlFor="helpfulness-rating" className="flex justify-between text-xs font-medium text-[#465149]">
                        <span>Helpfulness (40% weight)</span>
                        <span className="font-semibold text-[#1d4332]">{helpfulnessRating}/5</span>
                      </label>
                      <input
                        id="helpfulness-rating"
                        type="range"
                        min="1"
                        max="5"
                        value={helpfulnessRating}
                        onChange={(e) => setHelpfulnessRating(Number(e.target.value))}
                        className="mt-2 h-1.5 w-full cursor-pointer rounded-lg bg-[#eef2eb] accent-[#1d4332]"
                      />
                    </div>

                    {/* Creativity Slider */}
                    <div>
                      <label htmlFor="creativity-rating" className="flex justify-between text-xs font-medium text-[#465149]">
                        <span>Creativity (20% weight)</span>
                        <span className="font-semibold text-[#1d4332]">{creativityRating}/5</span>
                      </label>
                      <input
                        id="creativity-rating"
                        type="range"
                        min="1"
                        max="5"
                        value={creativityRating}
                        onChange={(e) => setCreativityRating(Number(e.target.value))}
                        className="mt-2 h-1.5 w-full cursor-pointer rounded-lg bg-[#eef2eb] accent-[#1d4332]"
                      />
                    </div>

                    {/* Ubuntu Alignment Toggle */}
                    <div className="flex flex-col justify-between">
                      <span className="text-xs font-medium text-[#465149]">Ubuntu Alignment (50% weight)</span>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          id="ubuntu-alignment"
                          type="checkbox"
                          checked={ubuntuAlignment}
                          onChange={(e) => setUbuntuAlignment(e.target.checked)}
                          className="h-4 w-4 rounded border-[#c8d0c5] text-[#1d4332] focus:ring-[#1d4332]"
                        />
                        <label htmlFor="ubuntu-alignment" className="text-xs text-[#465149]">
                          {ubuntuAlignment ? 'Aligned (Pass)' : 'Not Aligned (Fail)'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between border-t border-[#e7ece4] pt-4 gap-3">
                    <button
                      type="button"
                      onClick={scoreActiveOutput}
                      className="rounded-md bg-[#1d4332] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163629]"
                    >
                      Calculate Weighted Score
                    </button>
                    {score !== null && (
                      <p className="text-xl font-bold text-[#1d4332]">
                        Weighted score: <span className="text-2xl">{score.toFixed(2)}</span> <span className="text-xs font-normal text-[#465149]">/ 5.00 max</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="leaderboard" className="border-b border-[#d8ded5]">
          <div className="mx-auto max-w-7xl px-5 py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b4d23]">Leaderboard</p>
                <h2 className="mt-3 text-3xl font-semibold">Quality, cost, and latency in one view</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#465149]">
                Production aggregates outputs, ratings, model metadata, token costs, and p95 latency. Demo mode serves the same shape from seed data.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-lg border border-[#d8ded5] bg-white">
              <div className="grid grid-cols-[1.3fr_0.8fr_repeat(5,0.7fr)] border-b border-[#d8ded5] bg-[#eef2eb] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#5f695d] max-lg:hidden">
                <span>Model</span>
                <span>Provider</span>
                <span>Overall</span>
                <span>Ubuntu</span>
                <span>p95</span>
                <span>Cost/1k</span>
                <span>Runs</span>
              </div>
              {demoLeaderboard.map((row) => (
                <div key={row.modelId} className="grid gap-2 border-b border-[#e7ece4] px-4 py-4 last:border-b-0 lg:grid-cols-[1.3fr_0.8fr_repeat(5,0.7fr)]">
                  <span className="font-semibold">{row.model}</span>
                  <span className="text-[#465149]">{row.provider}</span>
                  <span>{row.overall}</span>
                  <span>{Math.round(row.ubuntuPct * 100)}%</span>
                  <span>{row.p95LatencyMs} ms</span>
                  <span>${row.costPer1k.toFixed(4)}</span>
                  <span>{row.runs}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="architecture" className="border-b border-[#d8ded5] bg-[#111111] text-[#f7f8f5]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f0a36d]">Technical Notes</p>
              <h2 className="mt-3 text-3xl font-semibold">What the codebase demonstrates</h2>
              <p className="mt-4 leading-7 text-[#d8d0c4]">
                Umbono is a Next.js API-backed evaluation platform for running the same prompt across providers, storing outputs, applying weighted human ratings, and turning the results into operational model-selection metrics.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Provider abstraction', 'OpenAI, Anthropic, Google, and Mistral execution paths with provider-specific token and streaming handling.'],
                ['Auth and RLS posture', 'Supabase auth, user-scoped resources, profile/settings APIs, and row-level security SQL are present for production mode.'],
                ['Evaluation pipeline', 'Prompts, runs, outputs, criteria, ratings, computed scores, latency, and cost all flow through typed API routes.'],
                ['Portfolio demo safety', 'DEMO_MODE swaps real credentials, network calls, destructive actions, and database writes for deterministic seed responses.'],
              ].map(([title, body]) => (
                <div key={title} className="border-t border-[#3c3833] pt-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#d8d0c4]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="deploy" className="bg-[#ffffff]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
            {[
              ['Run locally', 'npm run demo starts Next.js with DEMO_MODE and NEXT_PUBLIC_DEMO_MODE enabled.'],
              ['Deploy publicly', 'Set DEMO_MODE=true and NEXT_PUBLIC_DEMO_MODE=true on the host. Supabase and AI keys are optional in demo mode.'],
              ['What is mocked', 'Auth, model lists, templates, eval sets, provider outputs, scoring writes, exports, and destructive actions are simulated.'],
            ].map(([title, body]) => (
              <div key={title} className="border-t border-[#c8d0c5] pt-4">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#465149]">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
