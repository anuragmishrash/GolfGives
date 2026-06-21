import { createClient } from '@supabase/supabase-js';

/**
 * Frontend Supabase client — uses the PUBLIC anon key only.
 * Never put the service_role key here.
 *
 * Used exclusively for:
 *  - Google OAuth redirect flow (signInWithOAuth)
 *  - Reading session after OAuth callback (getSession)
 *  - Profile upsert on first OAuth login (insert into profiles)
 *
 * All protected data fetching goes through the Express backend via axios.
 */
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: false,   // We manage tokens in localStorage ourselves
    autoRefreshToken: false, // We handle refresh via our axios interceptor
  },
});

/**
 * Trigger Google OAuth redirect.
 * Supabase will redirect the browser to Google, then back to /auth/callback.
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  return data;
};
