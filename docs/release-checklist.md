# Release checklist

Use this checklist before publishing a deployment or presenting a new Umbono release.

## Product

- Landing page states the value and links to the working studio.
- Demo mode completes a comparison without credentials or network calls.
- Live mode is unavailable when server configuration is incomplete.
- Live mode succeeds against the intended OpenAI-compatible endpoint.
- Provider errors are isolated per model and do not erase successful output.
- Human scoring updates the correct session leaderboard.
- Refreshing clears run and score state as documented.

## Security and privacy

- No `.env*` file other than `.env.example` is staged.
- No provider key appears in source, generated bundles, screenshots, logs, or issue text.
- `/api/status` exposes no credentials.
- Selected model IDs are bounded by the server allowlist.
- Provider budget and retention settings are appropriate for the deployment.
- Deployment documentation tells operators not to send sensitive prompts without reviewing provider terms.

## Quality

```bash
npm ci
npm run verify
npm audit --omit=dev
```

- Production dependency advisories have been reviewed. Do not apply `npm audit fix --force` without inspecting the proposed dependency and framework changes.
- Desktop and mobile layouts have been reviewed.
- Dark and light system themes have been reviewed.
- Keyboard navigation, focus, loading, empty, error, and disabled states work.
- Reduced-motion mode removes nonessential animation.
- README commands work from a clean clone.
- Configuration and architecture docs match the current code.

## Repository

- License and security policy are present.
- Release notes distinguish demo fixtures from live-provider behavior.
- GitHub description and homepage match the deployed product.
- Social preview artwork uses the current landing page and does not imply fabricated model results.
