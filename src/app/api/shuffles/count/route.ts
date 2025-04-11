import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const supabaseAdmin = createSupabaseAdmin()

  try {
    console.log('API: Fetching global shuffles count')

    // Get all shuffles count regardless of whether users are on leaderboard or not
    const { count: globalCount, error: globalError } = await supabaseAdmin
      .from('global_shuffles')
      .select('*', { count: 'exact', head: true })

    if (globalError) {
      console.error('Error counting global shuffles:', globalError)
      return NextResponse.json({ error: globalError.message }, { status: 500 })
    }

    console.log('API: Total global shuffles count:', globalCount)

    // If userId is provided, get user's shuffle counts
    if (userId) {
      const { count: userTotalCount, error: userTotalError } = await supabaseAdmin
        .from('global_shuffles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (userTotalError) {
        console.error('Error counting user shuffles:', userTotalError)
        return NextResponse.json({ error: userTotalError.message }, { status: 500 })
      }

      const { count: userSavedCount, error: userSavedError } = await supabaseAdmin
        .from('global_shuffles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_saved', true)

      if (userSavedError) {
        console.error('Error counting user saved shuffles:', userSavedError)
        return NextResponse.json({ error: userSavedError.message }, { status: 500 })
      }

      // Return consistent response with both count and total fields
      return NextResponse.json({
        count: globalCount,
        total: globalCount,
        user: {
          total: userTotalCount,
          saved: userSavedCount,
        },
      })
    }

    // Return consistent response with both count and total fields
    return NextResponse.json({
      count: globalCount,
      total: globalCount,
    })
  } catch (error) {
    console.error('Unexpected error counting shuffles:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
