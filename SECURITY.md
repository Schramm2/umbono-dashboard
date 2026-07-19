# Security policy

## Supported version

Security fixes target the latest commit on the default branch.

## Report a vulnerability

Please report vulnerabilities privately through GitHub's security advisory flow for this repository. Do not open a public issue with exploit details, credentials, sensitive prompts, or provider responses.

Include:

- the affected route or file;
- a minimal reproduction;
- the impact and required conditions;
- suggested mitigation, if known.

## Credential handling

- Store provider keys in `.env.local` or your deployment platform's encrypted server environment.
- Never use a `NEXT_PUBLIC_` prefix for provider credentials.
- Never commit `.env.local`; it is ignored by Git.
- Rotate a key immediately if it appears in a commit, log, screenshot, issue, or browser bundle.
- Use provider-side budgets and access restrictions where available.
- Keep `UMBONO_ALLOW_LIVE_IN_PRODUCTION=false` on public demo deployments.
- Add authentication and rate limiting before explicitly enabling production live mode.

## Data handling

Umbono does not persist prompts, model outputs, or human ratings. Live prompts are sent to the operator's configured provider. Review that provider's retention and privacy terms before sending confidential, personal, regulated, or client data.
