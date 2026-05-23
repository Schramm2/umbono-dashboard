import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from './demo-mode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl && !isDemoMode) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.'
  );
}

if (!supabaseServiceKey && !isDemoMode) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please check your .env.local file.\n' +
    'Get this from Supabase Dashboard → Settings → API → service_role key (secret)'
  );
}

// TypeScript now knows these are strings after the checks above
const supabaseUrlString: string = supabaseUrl || 'https://demo.supabase.local';
const supabaseServiceKeyString: string = supabaseServiceKey || 'demo-service-role-key';

// Server-side client with service role for admin operations
export const supabaseAdmin = createClient(supabaseUrlString, supabaseServiceKeyString, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client-side auth client (for use in API routes with user tokens)
export function createSupabaseClient(authToken?: string) {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseAnonKey && !isDemoMode) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.'
    );
  }
  const supabaseAnonKeyString = supabaseAnonKey || 'demo-anon-key';
  
  if (authToken) {
    // Create authenticated client with user's token
    return createClient(supabaseUrlString, supabaseAnonKeyString, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    });
  }
  
  // Return unauthenticated client
  return createClient(supabaseUrlString, supabaseAnonKeyString);
}
