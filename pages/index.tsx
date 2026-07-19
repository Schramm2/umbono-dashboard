import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'

import { aggregateLeaderboard, syntheticHistory } from '../lib/evaluation'

const ranking = aggregateLeaderboard(syntheticHistory).slice(0, 4)

const Home: NextPage = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Umbono',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'An open-source studio for reproducible multi-model AI evaluations and human-scored comparisons.',
    codeRepository: 'https://github.com/Schramm2/umbono-dashboard',
    license: 'https://opensource.org/license/mit',
  }

  return (
    <div className="landing-shell">
      <Head>
        <title>Umbono | Open-source AI evaluation studio</title>
        <meta name="description" content="Run reproducible multi-model comparisons, inspect cost and latency, and score outputs with a visible human rubric." />
        <meta property="og:title" content="Umbono | Open-source AI evaluation studio" />
        <meta property="og:description" content="Compare models with evidence you can inspect, score, and explain." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <header className="landing-nav">
        <a href="#top" className="brand landing-brand" aria-label="Umbono home">
          <span className="brand-symbol" aria-hidden="true">U</span>
          <span>
            <strong>Umbono</strong>
            <small>Open evaluation studio</small>
          </span>
        </a>
        <nav aria-label="Landing page navigation">
          <a href="#workflow">Workflow</a>
          <a href="#open-source">Open source</a>
          <Link href="/docs">Docs</Link>
        </nav>
        <Link className="nav-action" href="/studio">Open studio</Link>
      </header>

      <main id="top">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <p className="eyebrow">Model decisions, made inspectable</p>
            <h1 id="hero-title">Know which model wins.</h1>
            <p>Run comparable prompts, inspect operational tradeoffs, and score every output with a rubric your team can explain.</p>
            <div className="landing-actions">
              <Link className="button button-primary" href="/studio">Open studio</Link>
              <a className="text-link" href="https://github.com/Schramm2/umbono-dashboard">View on GitHub <span aria-hidden="true">↗</span></a>
            </div>
          </div>

          <div className="benchmark-visual" aria-label="Example model ranking from deterministic demo data">
            <div className="benchmark-header">
              <div>
                <span>Evaluation result</span>
                <strong>Community guidance review</strong>
              </div>
              <span>Weighted / 5</span>
            </div>
            <ol>
              {ranking.map((model) => (
                <li key={model.modelId}>
                  <span className="benchmark-rank">{String(model.rank).padStart(2, '0')}</span>
                  <div>
                    <strong>{model.model}</strong>
                    <span>{model.p95LatencyMs} ms p95</span>
                  </div>
                  <span className="benchmark-score">{model.overall.toFixed(2)}</span>
                  <i style={{ '--benchmark-width': `${(model.overall / 5) * 100}%` } as React.CSSProperties} />
                </li>
              ))}
            </ol>
            <div className="benchmark-footer">
              <span>Deterministic demo fixture</span>
              <span>{syntheticHistory.length} scored outputs</span>
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="Product principles">
          <p><strong>No account required.</strong> The demo runs entirely in browser memory.</p>
          <p><strong>Bring one API key.</strong> Live mode supports OpenAI-compatible endpoints.</p>
          <p><strong>Audit the method.</strong> Scoring and aggregation are tested pure functions.</p>
        </section>

        <section id="workflow" className="workflow-section" aria-labelledby="workflow-title">
          <div className="workflow-intro">
            <h2 id="workflow-title">From prompt to decision, without the spreadsheet.</h2>
            <p>Umbono keeps model output, operational metadata, human judgment, and the resulting rank in one reproducible flow.</p>
          </div>
          <div className="workflow-track">
            {[
              ['Configure', 'Choose an evaluation set, prompt fixture, and up to four models.'],
              ['Compare', 'Run requests in parallel and inspect each response beside latency, tokens, and cost.'],
              ['Score', 'Apply a weighted rubric that keeps human judgment visible and reviewable.'],
              ['Decide', 'Rank quality and operational tradeoffs using calculations defined in the repository.'],
            ].map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="capability-section" aria-labelledby="capability-title">
          <div className="capability-copy">
            <h2 id="capability-title">A real evaluation workflow, with an honest demo boundary.</h2>
            <p>The included fixtures prove the product without credentials. Live mode swaps in your configured models while keeping keys on the server.</p>
            <Link className="text-link" href="/studio">Try the evaluator <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="capability-grid">
            <article className="capability-large">
              <span>Human rubric</span>
              <strong>100%</strong>
              <p>Explicit weights across clarity, usefulness, creativity, and values alignment.</p>
            </article>
            <article>
              <span>Parallel runs</span>
              <strong>1-4</strong>
              <p>Models per comparison, bounded for predictable local use.</p>
            </article>
            <article className="capability-accent">
              <span>Provider support</span>
              <strong>OpenAI-compatible</strong>
              <p>Works with hosted gateways and local compatible servers.</p>
            </article>
          </div>
        </section>

        <section id="open-source" className="quickstart-section" aria-labelledby="quickstart-title">
          <div>
            <p className="eyebrow">Clone to first run</p>
            <h2 id="quickstart-title">A five-minute setup that starts in demo mode.</h2>
            <p>Clone, install, and open the studio. Add provider variables only when you are ready to spend live tokens.</p>
            <a className="button button-primary" href="https://github.com/Schramm2/umbono-dashboard#quick-start">Read the README</a>
          </div>
          <pre className="quickstart-code" aria-label="Local setup commands"><code><span>$</span> git clone https://github.com/Schramm2/umbono-dashboard.git{`\n`}<span>$</span> cd umbono-dashboard{`\n`}<span>$</span> npm ci{`\n`}<span>$</span> npm run setup{`\n`}<span>$</span> npm run dev</code></pre>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <h2 id="cta-title">Run the same question through more than one lens.</h2>
          <p>Start with deterministic fixtures, then connect your provider when the workflow makes sense.</p>
          <div className="landing-actions">
            <Link className="button button-primary" href="/studio">Open studio</Link>
            <a className="text-link" href="https://github.com/Schramm2/umbono-dashboard">Fork the project <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>Umbono</strong>
          <span>Open-source AI evaluation studio.</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/studio">Studio</Link>
          <a href="https://github.com/Schramm2/umbono-dashboard">GitHub</a>
          <a href="https://github.com/Schramm2/umbono-dashboard/blob/main/LICENSE">MIT license</a>
        </nav>
      </footer>
    </div>
  )
}

export default Home
