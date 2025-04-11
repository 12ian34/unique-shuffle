import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { generateUsername } from '@/utils/username-generator'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Parse request data
    const requestData = await request.json()
    const { is_saved = false, cards = [] } = requestData

    console.log('Tracking shuffle, is_saved:', is_saved)

    // Get current user (may be null for anonymous shuffles)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || null
    console.log('User ID for shuffle tracking:', userId || 'anonymous')

    // Insert shuffle event into global_shuffles table
    const { data, error } = await supabaseAdmin
      .from('global_shuffles')
      .insert([
        {
          user_id: userId,
          is_saved,
          cards,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('Failed to track shuffle:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully tracked shuffle, data:', data)

    // Get current count after insertion
    const { count: currentCount, error: countError } = await supabaseAdmin
      .from('global_shuffles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error getting updated count:', countError)
    } else {
      console.log('Current global shuffle count after insertion:', currentCount)
    }

    // Update leaderboard for logged-in users, even for non-saved shuffles
    if (userId) {
      try {
        // Check if user has a leaderboard entry
        const { data: leaderboardData, error: leaderboardFetchError } = await supabaseAdmin
          .from('leaderboard')
          .select('total_shuffles, shuffle_streak')
          .eq('user_id', userId)
          .single()

        if (!leaderboardFetchError) {
          // Leaderboard entry exists, update it
          const updatedTotalShuffles = (leaderboardData?.total_shuffles || 0) + 1

          console.log(
            `Updating leaderboard for user ${userId}: ${
              leaderboardData?.total_shuffles || 0
            } -> ${updatedTotalShuffles} shuffles`
          )

          await supabaseAdmin
            .from('leaderboard')
            .update({
              total_shuffles: updatedTotalShuffles,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        } else {
          // Leaderboard entry doesn't exist, create one
          console.log(`Creating new leaderboard entry for user ${userId}`)

          await supabaseAdmin.from('leaderboard').insert([
            {
              user_id: userId,
              username: user?.email?.split('@')[0] || generateUsername(userId),
              total_shuffles: 1,
              shuffle_streak: 0,
              achievements_count: 0,
              updated_at: new Date().toISOString(),
            },
          ])
        }

        // Update achievements based on the latest stats
        try {
          console.log('Updating achievements after tracking shuffle')
          // Use absolute URL for server-side API calls
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const achievementResponse = await fetch(`${baseUrl}/api/achievements`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          })

          if (!achievementResponse.ok) {
            console.error('Achievement update failed with status:', achievementResponse.status)
          } else {
            const achievementData = await achievementResponse.json()
            console.log('Achievements updated:', achievementData.count, 'achievements')
          }
        } catch (achievementError) {
          // Just log the error but don't fail the shuffle tracking
          console.error('Failed to update achievements:', achievementError)
        }
      } catch (leaderboardError) {
        console.error('Error updating leaderboard:', leaderboardError)
        // Don't fail the request for leaderboard update errors
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error tracking shuffle:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
