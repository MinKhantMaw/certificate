import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;

const url = env?.VITE_SUPABASE_URL?.trim();
const publishableKey = env?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

// Failing loudly here beats a stream of confusing 401s at every call site.
if (!url || !publishableKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.',
  );
}

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
