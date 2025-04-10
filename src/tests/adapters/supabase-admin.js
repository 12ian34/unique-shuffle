// This is a CommonJS adapter for supabase-admin to be used in tests
const { createClient } = require('@supabase/supabase-js')

// Create a Supabase client with the service role key to bypass RLS policies
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

module.exports = { createSupabaseAdmin }
