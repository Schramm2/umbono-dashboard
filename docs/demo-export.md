# Umbono static showcase

This source tree is a demo-only export of Umbono, an open-source studio for reproducible multi-model AI evaluations.

It includes the public landing page, documentation, evaluation studio, deterministic fixtures, calculation engine, and focused tests. It deliberately excludes API routes, provider credentials, persistence, authentication, and analytics. The studio therefore falls back to deterministic demo mode and makes no model-provider requests.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then choose **Open studio**.

## Verify and build

```bash
npm run verify
```

The static site is written to `out/`. Serve that directory from any static host. Environment variables do not enable live mode in this exported tree because server API routes are intentionally absent.

Calculation definitions are documented in [docs/calculations.md](docs/calculations.md). The full product, including the optional live provider adapter, is maintained at [Schramm2/umbono-dashboard](https://github.com/Schramm2/umbono-dashboard).

## License

[MIT](LICENSE) © Matthew Schramm.
