import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'

const Docs: NextPage = () => (
  <div className="landing-shell docs-shell">
    <Head>
      <title>Umbono documentation | Setup and configuration</title>
      <meta name="description" content="Install Umbono, run the deterministic demo, and connect an OpenAI-compatible model provider." />
    </Head>

    <header className="landing-nav">
      <Link href="/" className="brand landing-brand" aria-label="Umbono home">
        <span className="brand-symbol" aria-hidden="true">U</span>
        <span><strong>Umbono</strong><small>Documentation</small></span>
      </Link>
      <nav aria-label="Documentation navigation">
        <a href="#quickstart">Quick start</a>
        <a href="#live-mode">Live mode</a>
        <a href="#deployment">Deploy</a>
      </nav>
      <Link className="nav-action" href="/studio">Open studio</Link>
    </header>

    <main className="docs-layout">
      <aside className="docs-aside" aria-label="On this page">
        <span>On this page</span>
        <a href="#quickstart">Quick start</a>
        <a href="#live-mode">Live comparisons</a>
        <a href="#variables">Environment variables</a>
        <a href="#deployment">Deployment</a>
        <a href="#next">More documentation</a>
      </aside>

      <article className="docs-content">
        <header>
          <p className="eyebrow">Setup guide</p>
          <h1>Run your first comparison.</h1>
          <p>Umbono starts in deterministic demo mode. Live provider access is an optional server-side configuration.</p>
        </header>

        <section id="quickstart">
          <h2>Quick start</h2>
          <p>Use Node.js 20.9 or newer. The setup command creates a local environment file only when one does not already exist.</p>
          <pre><code>git clone https://github.com/Schramm2/umbono-dashboard.git{`\n`}cd umbono-dashboard{`\n`}npm ci{`\n`}npm run setup{`\n`}npm run dev</code></pre>
          <p>Open <a href="http://localhost:3000">http://localhost:3000</a>, then choose <strong>Open studio</strong>. Demo mode needs no API key and makes no provider request.</p>
        </section>

        <section id="live-mode">
          <h2>Enable live comparisons</h2>
          <p>Edit <code>.env.local</code> and configure one OpenAI-compatible endpoint. Model IDs must match the IDs accepted by that endpoint.</p>
          <pre><code>UMBONO_API_KEY=your-server-side-key{`\n`}UMBONO_BASE_URL=https://your-provider.example/v1{`\n`}UMBONO_MODELS=your-model-id,another-model-id</code></pre>
          <p>Restart the development server. The studio header will show <strong>Live provider ready</strong>, and the Live mode control will become available.</p>
          <div className="docs-callout">
            <strong>Keys stay on the server.</strong>
            <p>Never prefix the key with <code>NEXT_PUBLIC_</code>. Umbono sends prompts through <code>/api/compare</code>, so credentials are not included in browser JavaScript.</p>
          </div>
        </section>

        <section id="variables">
          <h2>Environment variables</h2>
          <div className="docs-table-wrap">
            <table>
              <thead><tr><th>Variable</th><th>Required</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td><code>UMBONO_API_KEY</code></td><td>Live only</td><td>Bearer token sent to the configured provider.</td></tr>
                <tr><td><code>UMBONO_BASE_URL</code></td><td>No</td><td>API root. Defaults to the OpenAI API root.</td></tr>
                <tr><td><code>UMBONO_MODELS</code></td><td>Live only</td><td>Comma-separated allowlist shown in the studio.</td></tr>
                <tr><td><code>UMBONO_ALLOW_LIVE_IN_PRODUCTION</code></td><td>Production live only</td><td>Explicit opt-in after adding authentication and rate limiting.</td></tr>
                <tr><td><code>UMBONO_MAX_TOKENS</code></td><td>No</td><td>Output cap per model. Defaults to 800.</td></tr>
                <tr><td><code>UMBONO_REQUEST_TIMEOUT_MS</code></td><td>No</td><td>Per-model timeout. Defaults to 45,000 ms.</td></tr>
                <tr><td><code>UMBONO_MODEL_PRICING</code></td><td>No</td><td>JSON rates used for estimated USD cost.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="deployment">
          <h2>Build and deploy</h2>
          <p>Run the complete local quality gate before deployment:</p>
          <pre><code>npm run verify{`\n`}npm run build{`\n`}npm start</code></pre>
          <p>Deploy as a Next.js application when live mode is needed. Set the same environment variables in your host and keep all credentials server-only. Production stays demo-only unless <code>UMBONO_ALLOW_LIVE_IN_PRODUCTION=true</code>; enable it only behind authentication and rate limiting.</p>
        </section>

        <section id="next">
          <h2>More documentation</h2>
          <div className="docs-links">
            <a href="https://github.com/Schramm2/umbono-dashboard/blob/main/docs/configuration.md"><strong>Configuration reference</strong><span>Provider setup, pricing, limits, and troubleshooting.</span></a>
            <a href="https://github.com/Schramm2/umbono-dashboard/blob/main/docs/architecture.md"><strong>Architecture</strong><span>Trust boundaries, request flow, and extension points.</span></a>
            <a href="https://github.com/Schramm2/umbono-dashboard/blob/main/CONTRIBUTING.md"><strong>Contributing</strong><span>Local workflow, verification, and pull request expectations.</span></a>
          </div>
        </section>
      </article>
    </main>

    <footer className="landing-footer">
      <div><strong>Umbono</strong><span>Documentation for operators and contributors.</span></div>
      <nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/studio">Studio</Link><a href="https://github.com/Schramm2/umbono-dashboard">GitHub</a></nav>
    </footer>
  </div>
)

export default Docs
