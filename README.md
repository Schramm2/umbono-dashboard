# Umbono - AI Evaluation Dashboard

An AI evaluation dashboard built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project created

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.local.example` to `.env.local` (or create `.env.local` manually)
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. Set up the database:
   - Go to your Supabase project SQL Editor
   - Run the SQL script from `schema.sql` to create all tables

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── pages/
│   ├── api/
│   │   └── models.ts        # API route for fetching models
│   ├── _app.tsx             # Next.js app wrapper
│   └── index.tsx            # Home page
├── styles/
│   └── globals.css          # Global styles with Tailwind
├── schema.sql               # Database schema
└── SETUP.md                 # Detailed setup instructions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

### GET /api/models
Fetches all active models from the database.

Response:
```json
{
  "success": true,
  "data": [...],
  "count": 0
}
```

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (ready for future use)

