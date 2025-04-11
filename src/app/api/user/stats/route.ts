import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { Card as CardType, UserStats, Shuffle } from '@/types'
import { generateUsername } from '@/utils/username-generator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get all user shuffles from database, regardless of saved status
    const { data: shuffles, error: shufflesError } = await supabaseAdmin
      .from('global_shuffles')
      .select('cards, created_at')
      .eq('user_id', userId)
      // Don't filter by is_saved - count all shuffles for stats
      .order('created_at', { ascending: false })

    if (shufflesError) {
      console.error('Error fetching shuffles:', shufflesError)
      return NextResponse.json({ error: shufflesError.message }, { status: 400 })
    }

    if (!shuffles || shuffles.length === 0) {
      return NextResponse.json({
        total_shuffles: 0,
        shuffle_streak: 0,
        achievements_count: 0,
        most_common_cards: [],
      })
    }

    // Directly count card occurrences
    const cardCounts: Record<string, { card: CardType; count: number }> = {}

    shuffles.forEach((shuffle) => {
      if (!shuffle.cards || !Array.isArray(shuffle.cards)) {
        console.warn('Invalid shuffle data:', shuffle)
        return
      }

      shuffle.cards.forEach((card) => {
        if (!card || !card.suit || !card.value) return

        const key = `${card.value}-${card.suit}`
        if (!cardCounts[key]) {
          cardCounts[key] = { card, count: 0 }
        }
        cardCounts[key].count++
      })
    })

    // Calculate shuffle streak
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Group shuffles by date (using a Map to preserve insertion order)
    const shufflesByDate = new Map<string, boolean>()

    shuffles.forEach((shuffle) => {
      if (!shuffle.created_at) return

      const shuffleDate = new Date(shuffle.created_at)
      shuffleDate.setHours(0, 0, 0, 0)

      // Store date as string key in format YYYY-MM-DD
      const dateStr = shuffleDate.toISOString().split('T')[0]
      shufflesByDate.set(dateStr, true)
    })

    // Get dates as array sorted in descending order (most recent first)
    const shuffleDates = Array.from(shufflesByDate.keys()).sort().reverse()

    if (shuffleDates.length > 0) {
      streak = 1 // Start with 1 for the most recent day

      const todayStr = today.toISOString().split('T')[0]
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // If most recent shuffle is not today or yesterday, streak is just 1
      if (shuffleDates[0] === todayStr || shuffleDates[0] === yesterdayStr) {
        // Check for consecutive days working backwards
        for (let i = 1; i < shuffleDates.length; i++) {
          const currentDate = new Date(shuffleDates[i - 1])
          currentDate.setDate(currentDate.getDate() - 1)
          const expectedPrevDateStr = currentDate.toISOString().split('T')[0]

          if (shuffleDates[i] === expectedPrevDateStr) {
            streak++
          } else {
            break
          }
        }
      }
    }

    // Get achievements count from leaderboard
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('achievements_count, shuffle_streak')
      .eq('user_id', userId)
      .single()

    // Default to 0 if there's an error or no data found
    let achievementsCount = 0
    if (!leaderboardError && leaderboardData) {
      achievementsCount = leaderboardData.achievements_count || 0
    }

    // Create and return the stats object
    const stats: UserStats = {
      total_shuffles: shuffles.length,
      shuffle_streak: streak,
      achievements_count: achievementsCount,
      most_common_cards: Object.values(cardCounts).sort((a, b) => b.count - a.count),
    }

    // Update the leaderboard with the calculated streak
    try {
      if (!leaderboardError && leaderboardData) {
        // Only update if the streak has changed
        if (leaderboardData.shuffle_streak !== streak) {
          await supabaseAdmin
            .from('leaderboard')
            .update({
              shuffle_streak: streak,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

          // Also update achievements since streak changed
          try {
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
              console.log(
                'Achievements updated after streak change:',
                achievementData.count,
                'achievements'
              )
            }
          } catch (achievementError) {
            // Log but don't fail the request
            console.error('Failed to update achievements after streak change:', achievementError)
          }
        }
      }
    } catch (updateError) {
      console.error('Error updating streak in leaderboard:', updateError)
      // Don't fail the request if update fails
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Unexpected error fetching user stats:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId, forceRecalculate } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get user shuffles count from database - count all shuffles, not just saved
    const { count: shufflesCount, error: shufflesError } = await supabaseAdmin
      .from('global_shuffles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    // Don't filter by is_saved - count all shuffles for stats

    if (shufflesError) {
      console.error('Error counting shuffles:', shufflesError)
      return NextResponse.json({ error: shufflesError.message }, { status: 400 })
    }

    // Get current leaderboard data
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (leaderboardError && leaderboardError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error fetching leaderboard data:', leaderboardError)
      return NextResponse.json({ error: leaderboardError.message }, { status: 400 })
    }

    // Force recalculate streak if requested
    let streak = leaderboardData?.shuffle_streak || 0
    if (forceRecalculate) {
      // This will fetch shuffles and recalculate the streak
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/user/stats?userId=${userId}`)
      if (response.ok) {
        const stats = await response.json()
        streak = stats.shuffle_streak
      }
    }

    // If leaderboard entry exists, update it
    if (leaderboardData) {
      const { error: updateError } = await supabaseAdmin
        .from('leaderboard')
        .update({
          total_shuffles: shufflesCount,
          shuffle_streak: streak,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating leaderboard:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    } else {
      // Create new leaderboard entry
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        return NextResponse.json({ error: userError.message }, { status: 400 })
      }

      const { error: insertError } = await supabaseAdmin.from('leaderboard').insert([
        {
          user_id: userId,
          username: userData.email?.split('@')[0] || generateUsername(userId),
          total_shuffles: shufflesCount,
          shuffle_streak: streak,
          achievements_count: 0,
          updated_at: new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error('Error creating leaderboard entry:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }

    // Trigger achievements update
    try {
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
      }
    } catch (achievementError) {
      console.error('Failed to update achievements:', achievementError)
    }

    return NextResponse.json({
      success: true,
      shuffles: shufflesCount,
      streak: streak,
    })
  } catch (error) {
    console.error('Unexpected error updating user stats:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
