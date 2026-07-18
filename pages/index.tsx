import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEvent, useMemo, useState } from 'react'

import {
  aggregateLeaderboard,
  calculateWeightedScore,
  criteria,
  evaluationSets,
  promptTemplates,
  runParallelSimulation,
  syntheticHistory,
  syntheticModels,
  upsertEvaluationRecord,
  type EvaluationRecord,
  type RatingValues,
  type SimulationRun,
} from '../lib/evaluation'

const initialSet = evaluationSets[0]

const initialRatings: RatingValues = {
  clarity: 4,
  usefulness: 4,
  creativity: 3,
  values_alignment: true,
}

const Home: NextPage = () => {
  const [evaluationSetId, setEvaluationSetId] = useState(initialSet.id)
  const [promptId, setPromptId] = useState(initialSet.promptIds[0])
  const [selectedModelIds, setSelectedModelIds] = useState(initialSet.defaultModelIds)
  const [run, setRun] = useState<SimulationRun | null>(null)
  const [activeModelId, setActiveModelId] = useState<string | null>(null)
  const [ratings, setRatings] = useState<RatingValues>(initialRatings)
  const [sessionRecords, setSessionRecords] = useState<EvaluationRecord[]>([])
  const [lastUpdatedModelId, setLastUpdatedModelId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Open a synthetic evaluation set to begin.')

  const currentSet = useMemo(
    () => evaluationSets.find((item) => item.id === evaluationSetId) || initialSet,
    [evaluationSetId],
  )
  const availablePrompts = useMemo(
    () => promptTemplates.filter((prompt) => currentSet.promptIds.includes(prompt.id)),
    [currentSet],
  )
  const activeOutput = run?.outputs.find((output) => output.modelId === activeModelId) || null
  const activeRecord = activeOutput && run
    ? sessionRecords.find((record) => record.id === `${run.id}:${activeOutput.modelId}`)
    : undefined
  const leaderboard = useMemo(
    () => aggregateLeaderboard([...syntheticHistory, ...sessionRecords]),
    [sessionRecords],
  )

  function openEvaluationSet(nextSetId: string) {
    const nextSet = evaluationSets.find((item) => item.id === nextSetId) || initialSet
    setEvaluationSetId(nextSet.id)
    setPromptId(nextSet.promptIds[0])
    setSelectedModelIds(nextSet.defaultModelIds)
    setRun(null)
    setActiveModelId(null)
    setLastUpdatedModelId(null)
    setStatus(`${nextSet.name} opened. Choose a prompt and synthetic model profiles.`)
  }

  function toggleModel(modelId: string) {
    setSelectedModelIds((current) =>
      current.includes(modelId)
        ? current.filter((id) => id !== modelId)
        : [...current, modelId],
    )
  }

  async function runEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedModelIds.length === 0) {
      setStatus('Select at least one synthetic model profile.')
      return
    }

    setIsRunning(true)
    setLastUpdatedModelId(null)
    setStatus('Running independent deterministic simulations in parallel…')

    try {
      const nextRun = await runParallelSimulation(evaluationSetId, promptId, selectedModelIds)
      setRun(nextRun)
      setActiveModelId(nextRun.outputs[0]?.modelId || null)
      setStatus('Simulation complete. Inspect the outputs, then apply the human-defined rubric.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The simulation could not be completed.')
    } finally {
      setIsRunning(false)
    }
  }

  function scoreActiveOutput() {
    if (!run || !activeOutput) {
      setStatus('Run the evaluation and select an output before scoring.')
      return
    }

    try {
      const score = calculateWeightedScore(ratings)
      const record: EvaluationRecord = {
        id: `${run.id}:${activeOutput.modelId}`,
        modelId: activeOutput.modelId,
        score,
        ratings: { ...ratings },
        latencyMs: activeOutput.latencyMs,
        inputTokens: activeOutput.inputTokens,
        outputTokens: activeOutput.outputTokens,
        costUsd: activeOutput.costUsd,
      }
      setSessionRecords((current) => upsertEvaluationRecord(current, record))
      setLastUpdatedModelId(activeOutput.modelId)
      setStatus(`${activeOutput.modelName} scored ${score.toFixed(2)} / 5. Its session leaderboard row has updated.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The score could not be calculated.')
    }
  }

  function setScaleRating(criterionId: string, value: number) {
    setRatings((current) => ({ ...current, [criterionId]: value }))
  }

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#17201b]">
      <Head>
        <title>Umbono — deterministic AI evaluation showcase</title>
        <meta
          name="description"
          content="A deterministic, synthetic demonstration of parallel model evaluation, weighted human scoring, cost, tokens, latency, comparison, and ranking."
        />
      </Head>

      <header className="sticky top-0 z-30 border-b border-[#cfd5ca] bg-[#f4f1e9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <a href="#top" className="text-sm font-bold uppercase tracking-[0.18em] text-[#214b38]">
            Umbono
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#b8c4b8] bg-white px-3 py-1 text-xs font-semibold text-[#214b38] sm:inline-flex">
              Static · synthetic · no external calls
            </span>
            <nav className="hidden items-center gap-5 text-sm text-[#4d5a52] md:flex" aria-label="Primary navigation">
              <a href="#evaluator" className="hover:text-[#17201b]">Evaluator</a>
              <a href="#leaderboard" className="hover:text-[#17201b]">Leaderboard</a>
              <a href="#method" className="hover:text-[#17201b]">Method</a>
            </nav>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="border-b border-[#cfd5ca]">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#a44f2a]">
                Deterministic evaluation laboratory
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#111512] sm:text-6xl lg:text-7xl">
                Compare models with criteria you can inspect.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#4d5a52]">
                Open an evaluation set, simulate multiple model profiles, inspect operational trade-offs, apply a weighted human rubric, and watch the leaderboard recalculate.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#evaluator" className="rounded-md bg-[#214b38] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#18382a]">
                  Run the showcase
                </a>
                <a href="#method" className="rounded-md border border-[#9eaa9f] bg-white/60 px-5 py-3 text-sm font-bold text-[#214b38] transition hover:border-[#214b38]">
                  Inspect the method
                </a>
              </div>
              <p className="mt-6 max-w-xl text-xs leading-5 text-[#68756c]">
                Every identity, output, score, latency, token count, and cost is synthetic. Nothing here is a live benchmark.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#bdc7bb] bg-[#111713] text-[#edf2ec] shadow-[0_24px_70px_rgba(30,54,41,0.18)]">
              <div className="flex items-center justify-between border-b border-[#344139] px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#a9b8ad]">Synthetic history</p>
                  <p className="mt-1 font-semibold">Leaderboard snapshot</p>
                </div>
                <span className="rounded-full bg-[#d9eadf] px-3 py-1 text-xs font-bold text-[#214b38]">Reproducible</span>
              </div>
              <div className="divide-y divide-[#344139]">
                {leaderboard.slice(0, 4).map((row) => (
                  <div key={row.modelId} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-4">
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-[#4a5a50] text-sm text-[#b9c5bd]">{row.rank}</span>
                    <div>
                      <p className="font-semibold">{row.model}</p>
                      <p className="mt-1 text-xs text-[#9baaa0]">{row.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold">{row.overall.toFixed(2)}</p>
                      <p className="text-xs text-[#9baaa0]">of 5</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="evaluator" className="border-b border-[#cfd5ca] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <div className="grid gap-8 lg:grid-cols-[330px_1fr]">
              <aside>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a44f2a]">Evaluation journey</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">From test set to ranked evidence</h2>
                <ol className="mt-7 space-y-4 text-sm text-[#4d5a52]">
                  {[
                    ['01', 'Open a synthetic evaluation set'],
                    ['02', 'Run model profiles in parallel'],
                    ['03', 'Compare outputs and metadata'],
                    ['04', 'Apply the weighted rubric'],
                    ['05', 'Observe the leaderboard update'],
                  ].map(([number, label]) => (
                    <li key={number} className="flex items-center gap-3 border-t border-[#dce1d9] pt-4">
                      <span className="font-mono text-xs text-[#a44f2a]">{number}</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-7 rounded-lg border border-[#d1d9cf] bg-[#f4f7f2] p-4" aria-live="polite">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#214b38]">Current status</p>
                  <p className="mt-2 text-sm leading-6 text-[#4d5a52]">{status}</p>
                </div>
              </aside>

              <div className="space-y-6">
                <form onSubmit={runEvaluation} className="rounded-xl border border-[#cfd5ca] bg-[#fbfcfa] p-5 sm:p-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="evaluation-set" className="text-sm font-bold">1. Evaluation set</label>
                      <select
                        id="evaluation-set"
                        value={evaluationSetId}
                        onChange={(event) => openEvaluationSet(event.target.value)}
                        className="mt-2 w-full rounded-md border border-[#b9c4b8] bg-white px-3 py-3 text-sm outline-none focus:border-[#214b38] focus:ring-2 focus:ring-[#214b38]/20"
                      >
                        {evaluationSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
                      </select>
                      <p className="mt-2 text-xs leading-5 text-[#68756c]">{currentSet.description}</p>
                    </div>
                    <div>
                      <label htmlFor="prompt-template" className="text-sm font-bold">2. Prompt fixture</label>
                      <select
                        id="prompt-template"
                        value={promptId}
                        onChange={(event) => {
                          setPromptId(event.target.value)
                          setRun(null)
                          setActiveModelId(null)
                        }}
                        className="mt-2 w-full rounded-md border border-[#b9c4b8] bg-white px-3 py-3 text-sm outline-none focus:border-[#214b38] focus:ring-2 focus:ring-[#214b38]/20"
                      >
                        {availablePrompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.title}</option>)}
                      </select>
                      <p className="mt-2 text-xs leading-5 text-[#68756c]">
                        {availablePrompts.find((prompt) => prompt.id === promptId)?.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-bold">3. Synthetic model profiles</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {syntheticModels.map((model) => {
                        const selected = selectedModelIds.includes(model.id)
                        return (
                          <button
                            key={model.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleModel(model.id)}
                            className={`rounded-lg border p-4 text-left transition ${
                              selected
                                ? 'border-[#214b38] bg-[#eaf3ed] shadow-sm'
                                : 'border-[#d6ddd3] bg-white hover:border-[#9aab9d]'
                            }`}
                          >
                            <span className="text-xs uppercase tracking-[0.12em] text-[#68756c]">{model.provider}</span>
                            <span className="mt-2 block font-bold">{model.name}</span>
                            <span className="mt-1 block text-xs text-[#68756c]">{model.profile}</span>
                            <span className="mt-4 block text-xs text-[#4d5a52]">Synthetic rate: ${model.outputCostPerMillion.toFixed(2)}/M output tokens</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#dce1d9] pt-5">
                    <p className="max-w-xl text-xs leading-5 text-[#68756c]">
                      The run uses checked-in functions and fixtures only. It creates no request, cookie, local storage entry, analytics event, or database write.
                    </p>
                    <button
                      type="submit"
                      disabled={isRunning}
                      className="rounded-md bg-[#214b38] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#18382a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRunning ? 'Simulating…' : 'Run parallel simulation'}
                    </button>
                  </div>
                </form>

                {run ? (
                  <div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a44f2a]">Comparison</p>
                        <h3 className="mt-2 text-2xl font-semibold">Inspect the simulated outputs</h3>
                      </div>
                      <span className="rounded-full bg-[#f3eadf] px-3 py-1 text-xs font-bold text-[#8a4427]">Run {run.id}</span>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      {run.outputs.map((output) => (
                        <button
                          key={output.modelId}
                          type="button"
                          aria-pressed={activeModelId === output.modelId}
                          onClick={() => setActiveModelId(output.modelId)}
                          className={`rounded-xl border bg-white p-5 text-left transition ${
                            activeModelId === output.modelId
                              ? 'border-[#214b38] ring-2 ring-[#214b38]/10'
                              : 'border-[#d6ddd3] hover:border-[#9aab9d]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold">{output.modelName}</p>
                              <p className="mt-1 text-xs text-[#68756c]">{output.provider}</p>
                            </div>
                            <span className="rounded bg-[#eef2eb] px-2 py-1 text-[11px] font-bold text-[#4d5a52]">SIMULATED</span>
                          </div>
                          <p className="mt-5 min-h-[120px] text-sm leading-6 text-[#3f4b43]">{output.text}</p>
                          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e0e5dd] pt-4 text-xs">
                            <div><dt className="text-[#778179]">Latency</dt><dd className="mt-1 font-bold">{output.latencyMs} ms</dd></div>
                            <div><dt className="text-[#778179]">Illustrative cost</dt><dd className="mt-1 font-bold">${output.costUsd.toFixed(6)}</dd></div>
                            <div><dt className="text-[#778179]">Input tokens</dt><dd className="mt-1 font-bold">{output.inputTokens}</dd></div>
                            <div><dt className="text-[#778179]">Output tokens</dt><dd className="mt-1 font-bold">{output.outputTokens}</dd></div>
                          </dl>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#bdc7bb] bg-[#f8faf7] p-10 text-center">
                    <p className="font-bold">No simulation yet</p>
                    <p className="mt-2 text-sm text-[#68756c]">Run the selected fixture to reveal side-by-side outputs and metadata.</p>
                  </div>
                )}

                {activeOutput && (
                  <section className="rounded-xl border border-[#cfd5ca] bg-[#17201b] p-5 text-[#f4f1e9] sm:p-6" aria-labelledby="rubric-heading">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e7a77e]">Human-defined rubric</p>
                        <h3 id="rubric-heading" className="mt-2 text-2xl font-semibold">Score {activeOutput.modelName}</h3>
                      </div>
                      <span className="text-xs text-[#b8c4bc]">Weights total 100%</span>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      {criteria.map((criterion) => (
                        <div key={criterion.id} className="border-t border-[#3b4840] pt-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <label htmlFor={`rating-${criterion.id}`} className="text-sm font-bold">{criterion.label}</label>
                              <p className="mt-1 text-xs leading-5 text-[#b8c4bc]">{criterion.description}</p>
                            </div>
                            <span className="rounded bg-[#26342c] px-2 py-1 text-xs text-[#dbe4dd]">{Math.round(criterion.weight * 100)}%</span>
                          </div>
                          {criterion.type === 'scale' ? (
                            <div className="mt-4 flex items-center gap-4">
                              <input
                                id={`rating-${criterion.id}`}
                                type="range"
                                min="1"
                                max="5"
                                value={ratings[criterion.id] as number}
                                onChange={(event) => setScaleRating(criterion.id, Number(event.target.value))}
                                className="h-1.5 w-full cursor-pointer accent-[#e7a77e]"
                              />
                              <output htmlFor={`rating-${criterion.id}`} className="w-10 text-right text-lg font-bold">
                                {ratings[criterion.id] as number}/5
                              </output>
                            </div>
                          ) : (
                            <label htmlFor={`rating-${criterion.id}`} className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
                              <input
                                id={`rating-${criterion.id}`}
                                type="checkbox"
                                checked={ratings[criterion.id] as boolean}
                                onChange={(event) => setRatings((current) => ({ ...current, [criterion.id]: event.target.checked }))}
                                className="h-4 w-4 accent-[#e7a77e]"
                              />
                              {ratings[criterion.id] ? 'Criterion passes' : 'Criterion does not pass'}
                            </label>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#3b4840] pt-5">
                      <p className="max-w-xl text-xs leading-5 text-[#b8c4bc]">
                        The score is a normalized weighted mean on a 0–5 scale. Saving updates browser memory only.
                      </p>
                      <div className="flex items-center gap-4">
                        {activeRecord && <span className="text-2xl font-semibold">{activeRecord.score.toFixed(2)} / 5</span>}
                        <button type="button" onClick={scoreActiveOutput} className="rounded-md bg-[#e7a77e] px-4 py-2.5 text-sm font-bold text-[#2d211a] transition hover:bg-[#f1b58e]">
                          Calculate and update leaderboard
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="leaderboard" className="border-b border-[#cfd5ca] bg-[#f4f1e9]">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a44f2a]">Leaderboard</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">One view of quality and operations</h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-[#4d5a52]">
                Seed history is synthetic and fixed. Scoring a comparison adds or replaces one session record and recalculates every aggregate below.
              </p>
            </div>

            <div className="mt-8 overflow-x-auto rounded-xl border border-[#c8d1c6] bg-white">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-[#e8ede6] text-xs uppercase tracking-[0.1em] text-[#5f6b63]">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Overall</th>
                    <th className="px-4 py-3">Values</th>
                    <th className="px-4 py-3">p95 latency</th>
                    <th className="px-4 py-3">Cost / 1k</th>
                    <th className="px-4 py-3">Tokens</th>
                    <th className="px-4 py-3">Runs</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr key={row.modelId} className={`border-t border-[#e2e7e0] ${lastUpdatedModelId === row.modelId ? 'bg-[#eef7f1]' : ''}`}>
                      <td className="px-4 py-4 font-mono text-[#6c776f]">#{row.rank}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-bold">{row.model}</p>
                            <p className="mt-1 text-xs text-[#6c776f]">{row.provider}</p>
                          </div>
                          {lastUpdatedModelId === row.modelId && <span className="rounded-full bg-[#dbeee2] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#214b38]">Session update</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-lg font-bold">{row.overall.toFixed(2)}</td>
                      <td className="px-4 py-4">{Math.round(row.valuesAlignmentPct * 100)}%</td>
                      <td className="px-4 py-4">{row.p95LatencyMs} ms</td>
                      <td className="px-4 py-4">${row.costPer1k.toFixed(4)}</td>
                      <td className="px-4 py-4">{row.totalTokens.toLocaleString()}</td>
                      <td className="px-4 py-4">{row.runs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#68756c]">
              p95 uses the nearest-rank method. Cost per 1k is total illustrative cost ÷ total tokens × 1,000. Ranking uses overall score, then lower p95 latency, then model name.
            </p>
          </div>
        </section>

        <section id="method" className="bg-[#111713] text-[#edf2ec]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e7a77e]">Public-safe method</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">The boundary is part of the evidence.</h2>
              <p className="mt-5 max-w-lg leading-7 text-[#b8c4bc]">
                The deployable build is static. All behavior comes from one checked-in deterministic engine, and the browser holds the only mutable state for the current session.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ['No credentials', 'No environment variables, auth tokens, provider keys, or accounts are accepted.'],
                ['No external calls', 'The canonical interface contains no fetch, SDK, database, or analytics integration.'],
                ['Auditable math', 'Weights, p95, token totals, cost, and ranking live in pure functions with focused tests.'],
                ['Honest evidence', 'Every identity and measurement is labelled synthetic; no live benchmark is implied.'],
              ].map(([title, body]) => (
                <article key={title} className="border-t border-[#3b4840] pt-4">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#b8c4bc]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
