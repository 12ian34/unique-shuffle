import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with real-time features completely disabled
// and no auto refresh of auth to prevent polling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    // Disable all realtime subscriptions
    params: {
      eventsPerSecond: 0, // Set to 0 to disable
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: false, // Disable auto refresh to prevent polling
  },
})
