# Umbono - AI Evaluation Dashboard

An AI evaluation dashboard built with Next.js, TypeScript, Tailwind CSS, and Supabase. This platform enables comprehensive evaluation and comparison of multiple AI models across various providers including OpenAI, Anthropic, Google, and Mistral AI.

## Features

- **Multi-Provider AI Integration**: Support for OpenAI, Anthropic (Claude), Google Gemini, and Mistral AI models
- **Evaluation Management**: Create evaluation sets, run prompts across multiple models, and track performance metrics
- **Comprehensive Scoring**: Weighted evaluation criteria including Clarity, Helpfulness, Creativity, and Ubuntu Alignment
- **Leaderboard**: Aggregate performance metrics with filtering by date range, model, provider, and task type
- **Cost Tracking**: Monitor token usage and costs per model
- **Template Management**: Save and reuse prompt templates for consistent evaluations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project created
- API keys for AI providers you want to use:
  - OpenAI API key
  - Anthropic API key
  - Google API key
  - Mistral API key

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Provider API Keys (optional - only include providers you want to use)
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   ```

   > **Note**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Server-only variables (like API keys) should not have this prefix and will only be available in API routes and server-side code.

3. **Set up the database:**
   - Go to your Supabase project SQL Editor
   - Run the SQL script from `schema.sql` to create all tables and relationships
   - The schema includes tables for models, prompts, runs, outputs, evaluations, and more

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── lib/
│   ├── cors.ts              # CORS configuration for API routes
│   └── supabase.ts          # Supabase client initialization
├── pages/
│   ├── api/
│   │   ├── evalsets.ts      # Evaluation set management (CRUD operations)
│   │   ├── evaluate.ts      # Submit evaluation ratings and scores
│   │   ├── leaderboard.ts   # Aggregate model performance metrics
│   │   ├── models.ts        # Fetch available AI models
│   │   └── run.ts           # Create runs, execute prompts, manage templates
│   ├── _app.tsx             # Next.js app wrapper with global styles
│   └── index.tsx            # Home page
├── styles/
│   └── globals.css          # Global styles with Tailwind CSS
├── schema.sql               # Database schema and table definitions
├── example_models.sql       # Example model data for seeding
└── SETUP.md                 # Detailed setup instructions
```

## Available Scripts

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## API Routes

All API routes support CORS and handle preflight OPTIONS requests. Responses include appropriate CORS headers.

### GET /api/models
Fetches all active models from the database.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "GPT-4",
    "provider": "OpenAI",
    "version": "gpt-4",
    "max_tokens": 8192,
    "cost_input_per_million": 30.0,
    "cost_output_per_million": 60.0
  }
]
```

### GET /api/run
Fetches a run by ID or lists templates.

**Query Parameters:**
- `id` (string) - Run ID to fetch
- `templates=true` - List all prompt templates
- `template_id` (string) - Fetch specific template by ID

**Response (Run):**
```json
{
  "id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "notes": "Optional notes",
  "prompt": {
    "id": "uuid",
    "text": "Prompt text",
    "title": "Template title",
    "description": "Template description"
  },
  "outputs": [
    {
      "id": "uuid",
      "model_id": "uuid",
      "model_name": "GPT-4",
      "text": "Model response",
      "latency_ms": 1234,
      "cost": 0.001,
      "input_tokens": 100,
      "output_tokens": 200,
      "tokens_used": 300,
      "error": null,
      "computed_score": 4.5
    }
  ]
}
```

### POST /api/run
Creates a new run by executing a prompt across multiple models.

**Request Body:**
```json
{
  "prompt": "Your evaluation prompt",
  "model_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "outputs": [
    {
      "model_id": "uuid",
      "model_name": "GPT-4",
      "text": "Model response",
      "latency_ms": 1234,
      "input_tokens": 100,
      "output_tokens": 200,
      "cost": 0.001,
      "error": null
    }
  ]
}
```

**Save Template Action:**
```json
{
  "action": "save-template",
  "prompt_text": "Template prompt",
  "title": "Template Title",
  "description": "Template description"
}
```

### GET /api/evalsets
Lists evaluation sets or fetches a specific set with prompts.

**Query Parameters:**
- `id` (string) - Fetch specific eval set with prompts

**Response (List):**
```json
[
  {
    "id": "uuid",
    "name": "Eval Set Name",
    "description": "Description",
    "promptCount": 5,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/evalsets
Creates or updates an evaluation set.

**Request Body:**
```json
{
  "name": "Eval Set Name",
  "description": "Description",
  "prompt_ids": ["uuid1", "uuid2"]
}
```

### POST /api/evaluate
Submits evaluation ratings for an output.

**Request Body:**
```json
{
  "run_id": "uuid",
  "output_id": "uuid",
  "ratings": [
    {
      "criterion_id": "uuid",
      "score_value": 4
    }
  ]
}
```

**Response:**
```json
{
  "message": "Evaluation saved successfully!",
  "computed_score": 4.2,
  "score": 4.2
}
```

### GET /api/leaderboard
Fetches aggregated model performance metrics.

**Query Parameters:**
- `dateRange` (string) - "7", "30", "90", or "Last year"
- `modelId` (string) - Filter by specific model
- `provider` (string) - Filter by provider (e.g., "OpenAI")
- `tag` (string) - Filter by eval set/task type

**Response:**
```json
[
  {
    "modelId": "uuid",
    "model": "GPT-4",
    "provider": "OpenAI",
    "overall": 4.5,
    "ubuntuPct": 0.85,
    "clarity": 4.2,
    "helpfulness": 4.6,
    "creativity": 4.1,
    "p95LatencyMs": 2345,
    "costPer1k": 0.045,
    "runs": 100,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## Tech Stack

### Core Framework
- **[Next.js 14](https://nextjs.org/)** - React framework with API routes, server-side rendering, and file-based routing
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript for better developer experience
- **[React 18](https://react.dev/)** - UI library for building interactive interfaces

### Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development

### Database & Backend
- **[Supabase](https://supabase.com/)** - Open-source Firebase alternative providing:
  - PostgreSQL database with auto-generated REST APIs
  - Real-time subscriptions
  - Row-level security
  - Built-in authentication (ready for future use)

### AI Provider SDKs
- **[OpenAI Node.js SDK](https://github.com/openai/openai-node)** - Official OpenAI API client for Node.js
- **[Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)** - Official Anthropic Claude API client
- **[Google Generative AI SDK](https://github.com/google/generative-ai-nodejs)** - Google Gemini API client
- **[Mistral AI SDK](https://github.com/mistralai/mistral-sdk-typescript)** - Mistral AI API client

### Development Tools
- **ESLint** - Code linting and quality checks
- **PostCSS** - CSS processing with Tailwind
- **Autoprefixer** - Automatic vendor prefixing for CSS

## Environment Variables

Next.js supports environment variables through `.env.local` files. Variables are loaded automatically:

- **Server-only variables** (no `NEXT_PUBLIC_` prefix): Available only in API routes and server-side code
- **Public variables** (`NEXT_PUBLIC_` prefix): Exposed to the browser at build time

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Optional Variables (for AI providers)
- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude models
- `GOOGLE_API_KEY` - Google API key for Gemini models
- `MISTRAL_API_KEY` - Mistral API key for Mistral models

> **Security Note**: Never commit `.env.local` to version control. API keys should remain secret and only be used server-side.

## Database Schema

The application uses PostgreSQL via Supabase with the following main tables:

- **models** - AI model configurations (provider, version, costs)
- **prompts** - Evaluation prompts and templates
- **runs** - Execution runs linking prompts to outputs
- **outputs** - Model responses with metrics (latency, tokens, cost)
- **eval_sets** - Evaluation set definitions
- **eval_set_prompts** - Many-to-many relationship between eval sets and prompts
- **evaluation_criteria** - Scoring criteria definitions
- **ratings** - Individual criterion ratings for outputs

See `schema.sql` for the complete database schema.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license here]

## Support

For detailed setup instructions, see [SETUP.md](./SETUP.md).

