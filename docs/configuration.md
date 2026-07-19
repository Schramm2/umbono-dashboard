# Configuration reference

Umbono needs no environment variables in demo mode. Live mode activates only when both `UMBONO_API_KEY` and at least one `UMBONO_MODELS` entry are present on the server.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `UMBONO_API_KEY` | Empty | Bearer token for the configured provider. Required for live mode. |
| `UMBONO_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API root without `/chat/completions`. |
| `UMBONO_MODELS` | Empty | Comma-separated model allowlist. Required for live mode. |
| `UMBONO_ALLOW_LIVE_IN_PRODUCTION` | `false` | Explicitly enables billed provider calls in a production build. |
| `UMBONO_MAX_TOKENS` | `800` | Maximum completion tokens requested from each model. |
| `UMBONO_REQUEST_TIMEOUT_MS` | `45000` | Timeout applied independently to every model request. |
| `UMBONO_MODEL_PRICING` | Empty | JSON object with input/output USD rates per million tokens. |
| `UMBONO_APP_NAME` | `Umbono` | Value sent as `X-Title` for compatible gateways. |
| `UMBONO_SITE_URL` | Empty | Optional value sent as `HTTP-Referer` for compatible gateways. |

## Model configuration

Model IDs are treated as opaque provider values. Umbono does not rewrite them.

```dotenv
UMBONO_MODELS=team/quality-model,team/fast-model,local-model
```

The configured list is both a UI inventory and a server-side allowlist. A browser cannot request a model that is absent from this list.

## Production safeguard

Production builds stay demo-only by default, even when a provider key and model allowlist are present. This prevents a public portfolio deployment from becoming an anonymous proxy for a billed provider account.

Set the following only after you add authentication and rate limiting at your deployment layer or provider gateway:

```dotenv
UMBONO_ALLOW_LIVE_IN_PRODUCTION=true
```

Umbono also rejects browser requests whose `Origin` host does not match the application host. This is a defense-in-depth control, not a replacement for authentication or rate limiting.

## Pricing configuration

Pricing is optional and must be supplied explicitly:

```dotenv
UMBONO_MODEL_PRICING={"team/quality-model":{"input":2.5,"output":10},"team/fast-model":{"input":0.15,"output":0.6}}
```

Each `input` and `output` value is USD per million tokens. Both values are required for Umbono to display estimated cost for a model. Missing or malformed pricing fails closed to “Not set.”

## Compatible endpoint contract

Umbono sends:

```http
POST {UMBONO_BASE_URL}/chat/completions
Authorization: Bearer {UMBONO_API_KEY}
Content-Type: application/json
```

```json
{
  "model": "configured-model-id",
  "messages": [{ "role": "user", "content": "evaluation prompt" }],
  "max_tokens": 800
}
```

It reads text from `choices[0].message.content` and token usage from `usage.prompt_tokens`, `usage.completion_tokens`, and `usage.total_tokens`. Content may be a string or an array of text parts.

## Local compatible servers

Set `UMBONO_BASE_URL` to the server's OpenAI-compatible `/v1` root. If the local server ignores bearer authentication, use a non-secret placeholder key so Umbono can distinguish configured live mode from demo mode.

## Troubleshooting

### Live mode says “Needs setup”

- Confirm `.env.local` exists in the repository root.
- Confirm both `UMBONO_API_KEY` and `UMBONO_MODELS` are non-empty.
- Restart the development server after changing environment variables.
- Open `/api/status` and confirm `liveModeAvailable` is `true`.

### A model returns a provider error

- Confirm the model ID is valid for the configured endpoint.
- Confirm the account or gateway can access the model.
- Confirm the base URL does not already end in `/chat/completions`.
- Increase `UMBONO_REQUEST_TIMEOUT_MS` for slow local inference.

### Cost says “Not set”

Add both `input` and `output` values for the exact model ID in `UMBONO_MODEL_PRICING`. Umbono does not ship provider pricing because rates and model catalogs change independently of the project.
