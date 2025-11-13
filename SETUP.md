# Umbono Setup Instructions

## Task 1: Database Schema ✅

The database schema has been created in `schema.sql`. To set it up in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the script to create all tables and pre-populate evaluation criteria

## Task 2: Supabase Client Setup ✅

### Install Dependencies

Run the following npm command to install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

### Environment Variables

Create a `.env.local` file in the root of your project with the following content:

```env
# Supabase Configuration
# Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key (for admin operations - keep this secret!)
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase credentials from your project settings.

### Client Utility

The Supabase client utility has been created at `lib/supabase.ts` and is ready to use.

## Task 3: API Route ✅

The API route for fetching active models has been created at `pages/api/models.ts`.

### Usage

You can test the endpoint by making a GET request to:
```
http://localhost:3000/api/models
```

The endpoint will return all models where `is_active` is `true`, ordered by creation date (newest first).

