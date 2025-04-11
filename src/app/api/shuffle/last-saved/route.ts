import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServer } from '@/lib/supabase-server'

// Cache most recent shuffle query to prevent excessive database calls
let lastSavedShuffleCache: {
  userId: string
  data: any
  timestamp: number
} | null = null

// Cache duration: 1 minute
const CACHE_DURATION = 60000

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const supabaseAdmin = createSupabaseAdmin()

    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data.user) {
      console.log('No authenticated user found')
      return NextResponse.json(
        { shuffle: null, message: 'No authenticated user' },
        { status: 200 } // Return 200 even for no user to prevent errors
      )
    }

    const userId = data.user.id

    // Check if we have a cached response for this user
    if (
      lastSavedShuffleCache &&
      lastSavedShuffleCache.userId === userId &&
      Date.now() - lastSavedShuffleCache.timestamp < CACHE_DURATION
    ) {
      console.log('Using cached last saved shuffle')
      const response = NextResponse.json({ shuffle: lastSavedShuffleCache.data })
      response.headers.set('Cache-Control', 'public, max-age=60')
      return response
    }

    // Fetch the most recent saved shuffle for this user
    const { data: shuffles, error } = await supabaseAdmin
      .from('global_shuffles')
      .select('cards')
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching saved shuffle:', error)
      return NextResponse.json({ shuffle: null, error: error.message }, { status: 500 })
    }

    const shuffle = shuffles && shuffles.length > 0 ? shuffles[0] : null

    // Cache the response
    if (shuffle) {
      lastSavedShuffleCache = {
        userId,
        data: shuffle,
        timestamp: Date.now(),
      }
    }

    // Return with cache headers to prevent frequent fetches
    const response = NextResponse.json({ shuffle })
    response.headers.set('Cache-Control', 'public, max-age=60')
    return response
  } catch (error) {
    console.error('Unexpected error fetching last saved shuffle:', error)
    return NextResponse.json(
      { shuffle: null, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
