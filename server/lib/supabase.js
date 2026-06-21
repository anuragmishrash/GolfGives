const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase admin client — uses SERVICE_ROLE key.
 * This bypasses Row Level Security, which is safe for backend-only usage.
 * Never expose this key to the frontend.
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabase };
