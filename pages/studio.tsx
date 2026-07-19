import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

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
  type ModelIdentity,
  type RatingValues,
  type SimulationRun,
} from '../lib/evaluation'
import type { ProviderRun } from '../lib/provider'

const initialSet = evaluationSets[0]
const initialPrompt = promptTemplates.find((prompt) => prompt.id === initialSet.promptIds[0]) || promptTemplates[0]

const initialRatings: RatingValues = {
  clarity: 4,
  usefulness: 4,
  creativity: 3,
  values_alignment: true,
}

type StudioMode = 'demo' | 'live'

type ProviderStatus = {
  liveModeAvailable: boolean
  provider: string
  models: Array<{ id: string; label: string; pricingConfigured: boolean }>
}

const Studio: NextPage = () => {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  const [evaluationSetId, setEvaluationSetId] = useState(initialSet.id)
  const [promptId, setPromptId] = useState(initialSet.promptIds[0])
  const [customPrompt, setCustomPrompt] = useState(initialPrompt.text)
  const [selectedModelIds, setSelectedModelIds] = useState(initialSet.defaultModelIds)
  const [studioMode, setStudioMode] = useState<StudioMode>('demo')
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null)
  const [run, setRun] = useState<SimulationRun | ProviderRun | null>(null)
  const [activeModelId, setActiveModelId] = useState<string | null>(null)
  const [ratings, setRatings] = useState<RatingValues>(initialRatings)
  const [sessionRecords, setSessionRecords] = useState<EvaluationRecord[]>([])
  const [lastUpdatedModelId, setLastUpdatedModelId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('Choose a test set and synthetic model profiles.')

  useEffect(() => {
    let active = true
    fetch('/api/status')
      .then(async (response) => {
        if (!response.ok) throw new Error('Status endpoint unavailable.')
        return response.json() as Promise<ProviderStatus>
      })
      .then((nextStatus) => {
        if (active) setProviderStatus(nextStatus)
      })
      .catch(() => {
        if (active) setProviderStatus({ liveModeAvailable: false, provider: 'Not configured', models: [] })
      })

    return () => {
      active = false
    }
  }, [])

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
  const liveModelIdentities = useMemo<ModelIdentity[]>(
    () => (providerStatus?.models || []).map((model) => ({
      id: model.id,
      name: model.label,
      provider: providerStatus?.provider || 'Configured provider',
      pricingConfigured: model.pricingConfigured,
    })),
    [providerStatus],
  )
  const leaderboard = useMemo(
    () => studioMode === 'demo'
      ? aggregateLeaderboard([...syntheticHistory, ...sessionRecords])
      : aggregateLeaderboard(sessionRecords, liveModelIdentities),
    [liveModelIdentities, sessionRecords, studioMode],
  )
  const modelOptions = studioMode === 'demo'
    ? syntheticModels.map((model) => ({
        id: model.id,
        name: model.name,
        description: model.profile,
        meta: `$${model.outputCostPerMillion.toFixed(2)}/M`,
      }))
    : (providerStatus?.models || []).map((model) => ({
        id: model.id,
        name: model.label,
        description: providerStatus?.provider || 'Configured provider',
        meta: model.pricingConfigured ? 'Priced' : 'No pricing',
      }))

  function changeStudioMode(nextMode: StudioMode) {
    if (nextMode === 'live' && !providerStatus?.liveModeAvailable) {
      setStatus('Live mode needs UMBONO_API_KEY and UMBONO_MODELS in .env.local.')
      return
    }

    setStudioMode(nextMode)
    setSelectedModelIds(nextMode === 'demo' ? currentSet.defaultModelIds : (providerStatus?.models || []).slice(0, 4).map((model) => model.id))
    setRun(null)
    setActiveModelId(null)
    setSessionRecords([])
    setLastUpdatedModelId(null)
    setCustomPrompt(availablePrompts.find((prompt) => prompt.id === promptId)?.text || '')
    setStatus(nextMode === 'demo'
      ? 'Demo mode is ready with deterministic synthetic profiles.'
      : 'Live mode is ready. Provider requests can incur usage costs.')
  }

  function openEvaluationSet(nextSetId: string) {
    const nextSet = evaluationSets.find((item) => item.id === nextSetId) || initialSet
    setEvaluationSetId(nextSet.id)
    setPromptId(nextSet.promptIds[0])
    setCustomPrompt(promptTemplates.find((prompt) => prompt.id === nextSet.promptIds[0])?.text || '')
    setSelectedModelIds(studioMode === 'demo' ? nextSet.defaultModelIds : (providerStatus?.models || []).slice(0, 4).map((model) => model.id))
    setRun(null)
    setActiveModelId(null)
    setLastUpdatedModelId(null)
    setStatus(`${nextSet.name} is ready. Choose the profiles you want to compare.`)
  }

  function toggleModel(modelId: string) {
    setSelectedModelIds((current) => {
      if (current.includes(modelId)) return current.filter((id) => id !== modelId)
      if (current.length >= 4) {
        setStatus('Comparisons are limited to four models per run.')
        return current
      }
      return [...current, modelId]
    })
  }

  async function runEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedModelIds.length === 0) {
      setStatus(`Select at least one ${studioMode === 'demo' ? 'synthetic profile' : 'configured model'}.`)
      return
    }

    setIsRunning(true)
    setLastUpdatedModelId(null)
    setStatus(studioMode === 'demo'
      ? 'Running deterministic simulations in parallel...'
      : 'Sending live requests in parallel. Provider usage may be billed...')

    try {
      let nextRun: SimulationRun | ProviderRun
      if (studioMode === 'demo') {
        nextRun = await runParallelSimulation(evaluationSetId, promptId, selectedModelIds)
      } else {
        const prompt = availablePrompts.find((item) => item.id === promptId)
        const response = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: customPrompt || prompt?.text,
            modelIds: selectedModelIds,
            evaluationSetId,
            promptId,
          }),
        })
        const payload = await response.json() as ProviderRun | { message?: string }
        if (!response.ok || !('outputs' in payload)) {
          throw new Error('message' in payload && payload.message ? payload.message : 'The live comparison failed.')
        }
        nextRun = payload
      }
      setRun(nextRun)
      setActiveModelId(nextRun.outputs[0]?.modelId || null)
      const failedOutputs = nextRun.outputs.filter((output) => 'error' in output && output.error).length
      setStatus(failedOutputs
        ? `Run completed with ${failedOutputs} provider error${failedOutputs === 1 ? '' : 's'}. Inspect each output for details.`
        : 'Run complete. Compare an output, then apply the rubric.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The comparison could not be completed.')
    } finally {
      setIsRunning(false)
    }
  }

  function scoreActiveOutput() {
    if (!run || !activeOutput) {
      setStatus('Run the evaluation and select an output before scoring.')
      return
    }
    if ('error' in activeOutput && activeOutput.error) {
      setStatus('Provider errors cannot be scored. Choose a successful output.')
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
        pricingConfigured: activeOutput.simulated
          ? true
          : ('pricingConfigured' in activeOutput && activeOutput.pricingConfigured),
      }
      setSessionRecords((current) => upsertEvaluationRecord(current, record))
      setLastUpdatedModelId(activeOutput.modelId)
      setStatus(`${activeOutput.modelName} scored ${score.toFixed(2)} out of 5. The ranking has updated.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The score could not be calculated.')
    }
  }

  function setScaleRating(criterionId: string, value: number) {
    setRatings((current) => ({ ...current, [criterionId]: value }))
  }

  function toggleTheme() {
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    setTheme((current) => {
      const currentIsLight = current === 'light' || (current === 'system' && systemPrefersLight)
      return currentIsLight ? 'dark' : 'light'
    })
  }

  return (
    <div className={`app-shell theme-${theme}`}>
      <Head>
        <title>Umbono | Explainable model evaluation</title>
        <meta
          name="description"
          content="Run deterministic demos or live multi-model comparisons, then score outputs with a visible human rubric."
        />
      </Head>

      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="Umbono home">
            <span className="brand-symbol" aria-hidden="true">U</span>
            <span>
              <strong>Umbono</strong>
              <small>Evaluation studio</small>
            </span>
          </Link>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#evaluator">Evaluate</a>
            <a href="#leaderboard">Ranking</a>
            <Link href="/docs">Docs</Link>
          </nav>
          <div className="topbar-actions">
            <div className="environment-label">
              <span className="environment-indicator" aria-hidden="true" />
              {providerStatus?.liveModeAvailable ? 'Live provider ready' : 'Demo environment'}
            </div>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle color theme">
              <span aria-hidden="true">◐</span>
              <span>Theme</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">Open model evaluation</p>
            <h1 id="page-title">Evaluate with evidence.</h1>
            <p className="intro-summary">
              Compare model behavior, score it with a visible rubric, and trace every ranking back to its inputs.
            </p>
            <div className="intro-actions">
              <a className="button button-primary" href="#evaluator">Open evaluator</a>
              <a className="text-link" href="#leaderboard">View ranking <span aria-hidden="true">↘</span></a>
            </div>
          </div>

          <div className="signal-panel" aria-label="Current synthetic leaderboard snapshot">
            <div className="signal-header">
              <div>
                <span>Current ranking</span>
                <strong>Quality signal</strong>
              </div>
              <span className="signal-scale">0.00 - 5.00</span>
            </div>
            <ol className="signal-list">
              {leaderboard.slice(0, 4).map((row) => (
                <li key={row.modelId}>
                  <span className="signal-rank">{String(row.rank).padStart(2, '0')}</span>
                  <div className="signal-model">
                    <strong>{row.model}</strong>
                    <span>{row.provider}</span>
                  </div>
                  <span className="signal-score">{row.overall.toFixed(2)}</span>
                  <span
                    className="signal-line"
                    style={{ '--signal-width': `${(row.overall / 5) * 100}%` } as React.CSSProperties}
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ol>
            <p className="signal-note">Demo ranking from fixed, reproducible fixtures.</p>
          </div>
        </section>

        <section id="evaluator" className="evaluator-section" aria-labelledby="evaluator-title">
          <div className="section-heading">
            <h2 id="evaluator-title">Build the comparison</h2>
            <p>Configure one run, inspect each response, then score the evidence.</p>
          </div>

          <div className="workspace">
            <form className="config-panel" onSubmit={runEvaluation}>
              <div className="panel-heading">
                <span>Configure</span>
                <span>{selectedModelIds.length} selected</span>
              </div>

              <div className="mode-switch" role="group" aria-label="Evaluation execution mode">
                <button
                  type="button"
                  className={studioMode === 'demo' ? 'is-active' : ''}
                  aria-pressed={studioMode === 'demo'}
                  onClick={() => changeStudioMode('demo')}
                >
                  Demo
                  <small>No credentials</small>
                </button>
                <button
                  type="button"
                  className={studioMode === 'live' ? 'is-active' : ''}
                  aria-pressed={studioMode === 'live'}
                  aria-disabled={!providerStatus?.liveModeAvailable}
                  disabled={!providerStatus?.liveModeAvailable}
                  onClick={() => changeStudioMode('live')}
                >
                  Live
                  <small>{providerStatus?.liveModeAvailable ? providerStatus.provider : 'Needs setup'}</small>
                </button>
              </div>

              <div className="field-group">
                <label htmlFor="evaluation-set">Evaluation set</label>
                <select
                  id="evaluation-set"
                  value={evaluationSetId}
                  onChange={(event) => openEvaluationSet(event.target.value)}
                >
                  {evaluationSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
                </select>
                <p>{currentSet.description}</p>
              </div>

              <div className="field-group">
                <label htmlFor="prompt-template">Prompt fixture</label>
                <select
                  id="prompt-template"
                  value={promptId}
                  onChange={(event) => {
                    setPromptId(event.target.value)
                    setCustomPrompt(promptTemplates.find((prompt) => prompt.id === event.target.value)?.text || '')
                    setRun(null)
                    setActiveModelId(null)
                  }}
                >
                  {availablePrompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.title}</option>)}
                </select>
                <p>{availablePrompts.find((prompt) => prompt.id === promptId)?.description}</p>
              </div>

              {studioMode === 'live' && (
                <div className="field-group live-prompt-field">
                  <label htmlFor="live-prompt">Prompt sent to each model</label>
                  <textarea
                    id="live-prompt"
                    value={customPrompt}
                    maxLength={20_000}
                    onChange={(event) => setCustomPrompt(event.target.value)}
                    aria-describedby="live-prompt-help"
                  />
                  <p id="live-prompt-help">Edit the selected fixture before the live run. Maximum 20,000 characters.</p>
                </div>
              )}

              <fieldset className="model-fieldset">
                <legend>{studioMode === 'demo' ? 'Synthetic profiles' : 'Configured models'}</legend>
                <div className="model-list">
                  {modelOptions.map((model) => {
                    const selected = selectedModelIds.includes(model.id)
                    return (
                      <button
                        key={model.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleModel(model.id)}
                        className={`model-option ${selected ? 'is-selected' : ''}`}
                      >
                        <span className="model-check" aria-hidden="true">{selected ? '✓' : ''}</span>
                        <span className="model-name">
                          <strong>{model.name}</strong>
                          <small>{model.description}</small>
                        </span>
                        <span className="model-rate">{model.meta}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <button className="button button-primary run-button" type="submit" disabled={isRunning}>
                {isRunning ? 'Running comparison...' : `Run ${studioMode} comparison`}
                <span aria-hidden="true">↗</span>
              </button>

              <div className="run-status" aria-live="polite">
                <span>Status</span>
                <p>{status}</p>
              </div>
            </form>

            <div className="evaluation-stage">
              <div className="stage-heading">
                <div>
                  <span>Compare</span>
                  <h3>{run ? `${run.simulated ? 'Demo' : 'Live'} output` : 'Output workspace'}</h3>
                </div>
                <span className="run-reference">{run ? `Run ${run.id}` : 'Waiting for run'}</span>
              </div>

              {run ? (
                <>
                  <div className="output-tabs" role="tablist" aria-label="Comparison outputs">
                    {run.outputs.map((output) => (
                      <button
                        key={output.modelId}
                        id={`tab-${output.modelId}`}
                        type="button"
                        role="tab"
                        aria-selected={activeModelId === output.modelId}
                        aria-controls={`panel-${output.modelId}`}
                        onClick={() => setActiveModelId(output.modelId)}
                      >
                        <span>{output.modelName}</span>
                        <small>{output.latencyMs} ms</small>
                      </button>
                    ))}
                  </div>

                  {activeOutput && (
                    <article
                      id={`panel-${activeOutput.modelId}`}
                      className="output-panel"
                      role="tabpanel"
                      aria-labelledby={`tab-${activeOutput.modelId}`}
                    >
                      <div className="output-context">
                        <div>
                          <span>Response from</span>
                          <strong>{activeOutput.provider}</strong>
                        </div>
                        <span className="synthetic-label">{activeOutput.simulated ? 'Synthetic fixture' : 'Live provider response'}</span>
                      </div>
                      <p className="output-copy">
                        {'error' in activeOutput && activeOutput.error
                          ? `Provider error: ${activeOutput.error}`
                          : activeOutput.text}
                      </p>
                      <dl className="metric-grid">
                        <div><dt>Latency</dt><dd>{activeOutput.latencyMs}<small>ms</small></dd></div>
                        <div><dt>Total tokens</dt><dd>{activeOutput.totalTokens}</dd></div>
                        <div><dt>Output tokens</dt><dd>{activeOutput.outputTokens}</dd></div>
                        <div>
                          <dt>{activeOutput.simulated ? 'Illustrative cost' : 'Estimated cost'}</dt>
                          <dd>{!activeOutput.simulated && 'pricingConfigured' in activeOutput && !activeOutput.pricingConfigured
                            ? 'Not set'
                            : `$${activeOutput.costUsd.toFixed(6)}`}</dd>
                        </div>
                      </dl>
                    </article>
                  )}

                  {activeOutput && !('error' in activeOutput && activeOutput.error) && (
                    <section className="rubric" aria-labelledby="rubric-heading">
                      <div className="rubric-heading">
                        <div>
                          <span>Score</span>
                          <h3 id="rubric-heading">Apply the human rubric</h3>
                        </div>
                        <p>Weights total 100%</p>
                      </div>

                      <div className="rubric-grid">
                        {criteria.map((criterion) => (
                          <div className="criterion" key={criterion.id}>
                            <div className="criterion-copy">
                              <label htmlFor={`rating-${criterion.id}`}>{criterion.label}</label>
                              <span>{Math.round(criterion.weight * 100)}%</span>
                              <p>{criterion.description}</p>
                            </div>
                            {criterion.type === 'scale' ? (
                              <div className="range-control">
                                <input
                                  id={`rating-${criterion.id}`}
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={ratings[criterion.id] as number}
                                  onChange={(event) => setScaleRating(criterion.id, Number(event.target.value))}
                                />
                                <output htmlFor={`rating-${criterion.id}`}>{ratings[criterion.id] as number}<small>/5</small></output>
                              </div>
                            ) : (
                              <label className="boolean-control" htmlFor={`rating-${criterion.id}`}>
                                <input
                                  id={`rating-${criterion.id}`}
                                  type="checkbox"
                                  checked={ratings[criterion.id] as boolean}
                                  onChange={(event) => setRatings((current) => ({ ...current, [criterion.id]: event.target.checked }))}
                                />
                                <span>{ratings[criterion.id] ? 'Criterion passes' : 'Criterion does not pass'}</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="rubric-action">
                        <p>Scoring stays in browser memory for this session only.</p>
                        <div>
                          {activeRecord && <strong className="calculated-score">{activeRecord.score.toFixed(2)}<small>/5</small></strong>}
                          <button className="button button-accent" type="button" onClick={scoreActiveOutput}>Update ranking</button>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="empty-stage">
                  <div className="empty-visual" aria-hidden="true">
                    <span /><span /><span /><span />
                  </div>
                  <div>
                    <strong>No comparison yet</strong>
                    <p>Your selected outputs and operational metrics will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="leaderboard" className="leaderboard-section" aria-labelledby="leaderboard-title">
          <div className="section-heading leaderboard-heading">
            <h2 id="leaderboard-title">Rank the evidence</h2>
            <p>{studioMode === 'demo'
              ? 'Session scores update the fixed synthetic history without persistence.'
              : 'Live scores rank the configured models for this browser session.'}</p>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Model</th>
                  <th scope="col">Overall</th>
                  <th scope="col">Values</th>
                  <th scope="col">p95 latency</th>
                  <th scope="col">Cost / 1k</th>
                  <th scope="col">Tokens</th>
                  <th scope="col">Runs</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row.modelId} className={lastUpdatedModelId === row.modelId ? 'is-updated' : ''}>
                    <td><span className="rank-number">{String(row.rank).padStart(2, '0')}</span></td>
                    <td>
                      <div className="table-model">
                        <strong>{row.model}</strong>
                        <span>{row.provider}</span>
                        {lastUpdatedModelId === row.modelId && <small>Session update</small>}
                      </div>
                    </td>
                    <td className="overall-score">{row.overall.toFixed(2)}</td>
                    <td>{Math.round(row.valuesAlignmentPct * 100)}%</td>
                    <td>{row.p95LatencyMs} ms</td>
                    <td>{row.pricingConfigured ? `$${row.costPer1k.toFixed(4)}` : 'Not set'}</td>
                    <td>{row.totalTokens.toLocaleString()}</td>
                    <td>{row.runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            p95 uses nearest-rank. Cost per 1k divides total illustrative cost by total tokens, then multiplies by 1,000.
          </p>
        </section>

        <section id="method" className="method-section" aria-labelledby="method-title">
          <div className="method-intro">
            <p className="eyebrow">Clear operating boundary</p>
            <h2 id="method-title">Demo freely. Connect live models deliberately.</h2>
            <p>The synthetic path needs no credentials. Live keys stay server-side and results remain session-only.</p>
          </div>
          <div className="method-list">
            {[
              ['Instant demo', 'No keys, accounts, database, or setup beyond npm install.'],
              ['Server-only keys', 'The browser calls Umbono, and Umbono calls your configured provider.'],
              ['Auditable math', 'Scoring, cost, p95, tokens, and ranking are tested pure functions.'],
              ['Session privacy', 'Prompts and scores are not persisted by Umbono.'],
            ].map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <span>Umbono</span>
          <p>Open-source AI evaluation studio.</p>
        </div>
        <Link href="/docs">Setup and documentation ↗</Link>
      </footer>
    </div>
  )
}

export default Studio
