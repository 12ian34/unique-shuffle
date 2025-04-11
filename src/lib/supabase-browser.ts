import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase browser client with real-time features disabled
 * and minimal auth polling to prevent excessive requests
 */
export function createDisabledRealtimeClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        // Disable auto refresh to prevent constant polling
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
