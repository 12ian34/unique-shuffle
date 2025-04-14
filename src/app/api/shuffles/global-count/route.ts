import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { GLOBAL_SHUFFLES_KEY } from '@/lib/constants'
import { ErrorType, ErrorSeverity, createError, createDatabaseError } from '@/lib/errors'
import { createClient } from '@/lib/supabase-server'

// Fetch the global shuffle count
export async function GET() {
  try {
    // Get the global count
    const { count, error } = await supabaseAdmin
      .from('shuffles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching global shuffle count:', error)
      const appError = createDatabaseError('Failed to fetch global shuffle count', {
        originalError: error,
      })
      return NextResponse.json({ error: appError }, { status: 500 })
    }

    // Try to get current user stats if authenticated
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    let userStats = null

    if (authData?.user) {
      // User is authenticated, fetch their stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('total_shuffles, shuffle_streak, last_shuffle_date')
        .eq('id', authData.user.id)
        .single()

      if (!userError && userData) {
        userStats = userData
      }
    }

    return NextResponse.json(
      {
        count,
        userStats,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching global shuffle count:', error)
    const appError = createError(
      'Failed to fetch global shuffle count',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'GLOBAL_COUNT_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
