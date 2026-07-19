# Contributing to Umbono

Thank you for helping improve Umbono. Focused bug fixes, accessibility improvements, documentation, evaluation methods, and carefully scoped provider support are welcome.

## Local setup

```bash
git clone https://github.com/Schramm2/umbono-dashboard.git
cd umbono-dashboard
npm ci
npm run setup
npm run dev
```

Demo mode is sufficient for frontend and calculation work. Use a live provider only when the change specifically needs it, and use test credentials with a constrained budget.

## Before changing the frontend

Read [DESIGN.md](DESIGN.md). Preserve the distinction between:

- the public landing and documentation surfaces;
- the dense, operational evaluation studio;
- demo copy and live-provider copy.

New controls need keyboard focus, hover, active, disabled, loading, error, empty, mobile, and reduced-motion behavior.

## Development workflow

1. Create a focused feature or bugfix branch.
2. Follow existing types, naming, and component patterns.
3. Add or update tests when behavior changes.
4. Run the narrowest useful test while working.
5. Run the complete quality gate before requesting review.

```bash
npm run verify
```

## Pull requests

Keep pull requests focused and explain:

- the user problem;
- the behavior or contract that changed;
- the verification you ran;
- any security, provider-cost, accessibility, or deployment impact.

Do not include provider keys, private prompts, generated output containing personal data, or machine-local paths in commits, screenshots, logs, or issue text.

## Provider integrations

Provider credentials and SDKs must remain server-only. New integrations must:

- validate model selection against a server allowlist;
- impose request length, model count, and timeout limits;
- return normalized output without credentials or raw sensitive headers;
- document provider retention and billing responsibility;
- include tests with a mocked transport rather than live billed requests.

## Reporting problems

Use GitHub issues for reproducible bugs and focused proposals. Follow [SECURITY.md](SECURITY.md) for vulnerabilities or accidental secret exposure.
