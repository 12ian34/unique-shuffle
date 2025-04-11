import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const supabaseAdmin = createSupabaseAdmin()

  try {
    console.log("API: Fetching leaderboard users' shuffle count")

    // Get all users from the leaderboard
    const { data: leaderboardUsers, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('user_id')

    if (leaderboardError) {
      console.error('Error fetching leaderboard users:', leaderboardError)
      return NextResponse.json({ error: leaderboardError.message }, { status: 500 })
    }

    // Extract user IDs from the leaderboard
    const leaderboardUserIds = leaderboardUsers.map((user) => user.user_id)

    // Get total shuffle count only from users on the leaderboard
    const { count: totalCount, error: totalError } = await supabaseAdmin
      .from('global_shuffles')
      .select('*', { count: 'exact', head: true })
      .in('user_id', leaderboardUserIds)

    if (totalError) {
      console.error('Error counting leaderboard shuffles:', totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    console.log("API: Total leaderboard users' shuffles count:", totalCount)

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

      return NextResponse.json({
        total: totalCount,
        user: {
          total: userTotalCount,
          saved: userSavedCount,
        },
      })
    }

    // If no userId, just return the total
    return NextResponse.json({ total: totalCount })
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
