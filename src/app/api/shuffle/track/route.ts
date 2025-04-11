import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { generateUsername } from '@/utils/username-generator'
import * as achievementChecks from '@/lib/achievement-checks'
import { getUnlockedAchievements } from '@/lib/achievements'

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

    // Include count in the response for easier debugging
    const responseData = {
      success: true,
      data,
      count: countError ? null : currentCount,
    }

    // For logged-in users, check for achievements on EVERY shuffle, not just saved ones
    if (userId) {
      try {
        // Check for pattern-based achievements in the current shuffle
        const patternBasedAchievements = []

        // Check for pattern achievements
        if (achievementChecks.hasTripleAcesFirst(cards)) {
          patternBasedAchievements.push('triple_aces_first')
        }

        if (achievementChecks.hasSequentialSameSuit(cards)) {
          patternBasedAchievements.push('sequential_shuffle')
        }

        if (achievementChecks.hasThreePairs(cards)) {
          patternBasedAchievements.push('three_pairs')
        }

        if (achievementChecks.hasSymmetricShuffle(cards)) {
          patternBasedAchievements.push('symmetric_shuffle')
        }

        if (achievementChecks.hasRainbowShuffle(cards)) {
          patternBasedAchievements.push('rainbow_shuffle')
        }

        if (achievementChecks.hasRoyalFlush(cards)) {
          patternBasedAchievements.push('royal_flush')
        }

        if (achievementChecks.hasAllQueensEarly(cards)) {
          patternBasedAchievements.push('lady_luck')
        }

        if (achievementChecks.hasFiveSameSuitInRow(cards)) {
          patternBasedAchievements.push('suited_up')
        }

        if (achievementChecks.hasOnlyEvenCardsFirst(cards)) {
          patternBasedAchievements.push('even_steven')
        }

        if (achievementChecks.hasAllAces(cards)) {
          patternBasedAchievements.push('ace_hunter')
        }

        if (achievementChecks.has007Pattern(cards)) {
          patternBasedAchievements.push('agent_007')
        }

        if (achievementChecks.hasBlackjack(cards)) {
          patternBasedAchievements.push('blackjack')
        }

        if (achievementChecks.hasFiveFaceCardsInRow(cards)) {
          patternBasedAchievements.push('high_roller')
        }

        if (achievementChecks.hasPerfectSequentialOrder(cards)) {
          patternBasedAchievements.push('perfect_shuffle')
        }

        // Check time-based achievements
        const timeChecks = achievementChecks.checkTimeBasedAchievements()

        if (timeChecks.isMidnight) {
          patternBasedAchievements.push('midnight_shuffle')
        }

        if (timeChecks.isMorning) {
          // Just mark the achievement - we'll need streak tracking for the full achievement
          patternBasedAchievements.push('morning_routine_single')
        }

        if (timeChecks.isWeekend) {
          // Just mark the achievement - we'll need streak tracking for the full achievement
          patternBasedAchievements.push('weekend_warrior_single')
        }

        if (timeChecks.isNightTime) {
          patternBasedAchievements.push('night_owl_single')
        }

        if (timeChecks.isTopOfHour) {
          patternBasedAchievements.push('shuffle_o_clock')
        }

        if (timeChecks.isNewYearsDay) {
          patternBasedAchievements.push('new_year_shuffle')
        }

        if (timeChecks.isMonday) {
          // Just mark the achievement - we'll need streak tracking for full achievement
          patternBasedAchievements.push('monday_blues_single')
        }

        if (timeChecks.isLeapDay) {
          patternBasedAchievements.push('leap_day')
        }

        if (timeChecks.isFridayThe13th) {
          patternBasedAchievements.push('friday_13')
        }

        if (timeChecks.isPalindromeDate) {
          patternBasedAchievements.push('palindrome_shuffle')
        }

        // If we found any pattern-based achievements, store them
        if (patternBasedAchievements.length > 0) {
          // Store the pattern achievements for this user
          try {
            await supabaseAdmin.from('user_achievements').insert(
              patternBasedAchievements.map((achievementId) => ({
                user_id: userId,
                achievement_id: achievementId,
                shuffle_id: data[0]?.id,
                achieved_at: new Date().toISOString(),
              }))
            )
            console.log(`Stored ${patternBasedAchievements.length} pattern-based achievements`)
          } catch (achievementError) {
            console.error('Error storing pattern achievements:', achievementError)
          }
        }

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

    return NextResponse.json(responseData)
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
