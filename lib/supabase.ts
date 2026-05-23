import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from './demo-mode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if ((!supabaseUrl || !supabaseAnonKey) && !isDemoMode) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.local',
  supabaseAnonKey || 'demo-anon-key'
);
