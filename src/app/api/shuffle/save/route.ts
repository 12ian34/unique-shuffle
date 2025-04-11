import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/supabase'
import { generateUsername } from '@/utils/username-generator'
import { nanoid } from 'nanoid'
import { getUnlockedAchievements } from '@/lib/achievements'
import * as achievementChecks from '@/lib/achievement-checks'

type Card = {
  suit: string
  value: string
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Parse request data
    const requestData = await request.json()
    const { cards = [] } = requestData

    // Authenticate the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: userError?.message,
        },
        { status: 401 }
      )
    }

    const userId = user.id

    // Create a unique ID for the shuffle
    // Must be limited to 20 chars to match VARCHAR(20) column in database
    const shuffleId = nanoid(20)

    // Insert the shuffle into the global_shuffles table
    const { data: shuffleData, error: shuffleError } = await supabaseAdmin
      .from('global_shuffles')
      .insert([
        {
          user_id: userId,
          cards,
          is_saved: true,
          share_code: shuffleId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (shuffleError) {
      console.error('Failed to save shuffle:', shuffleError)
      return NextResponse.json({ error: shuffleError.message }, { status: 500 })
    }

    console.log('Successfully saved shuffle to global_shuffles table, id:', shuffleData[0]?.id)

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
            shuffle_id: shuffleData[0]?.id,
            achieved_at: new Date().toISOString(),
          }))
        )
        console.log(`Stored ${patternBasedAchievements.length} pattern-based achievements`)
      } catch (achievementError) {
        console.error('Error storing pattern achievements:', achievementError)
      }
    }

    // Update the leaderboard with the new shuffle
    // First, check if the user already has a leaderboard entry
    const { data: leaderboardData, error: leaderboardFetchError } = await supabaseAdmin
      .from('leaderboard')
      .select('total_shuffles, shuffle_streak')
      .eq('user_id', userId)
      .single()

    let updatedTotalShuffles = 1
    let currentStreak = 0

    if (!leaderboardFetchError) {
      // Leaderboard entry exists, update it
      updatedTotalShuffles = (leaderboardData?.total_shuffles || 0) + 1
      currentStreak = leaderboardData?.shuffle_streak || 0

      // Update leaderboard and achievements in one operation
      const unlockedAchievements = getUnlockedAchievements({
        total_shuffles: updatedTotalShuffles,
        shuffle_streak: currentStreak,
        achievements_count: 0,
        most_common_cards: [],
      })

      await supabaseAdmin
        .from('leaderboard')
        .update({
          total_shuffles: updatedTotalShuffles,
          updated_at: new Date().toISOString(),
          achievements_count: unlockedAchievements.length,
        })
        .eq('user_id', userId)
    } else {
      // Leaderboard entry doesn't exist, create one
      // Generate achievements for a new user
      const unlockedAchievements = getUnlockedAchievements({
        total_shuffles: 1,
        shuffle_streak: 0,
        achievements_count: 0,
        most_common_cards: [],
      })

      await supabaseAdmin.from('leaderboard').insert([
        {
          user_id: userId,
          username: user.email?.split('@')[0] || generateUsername(userId),
          total_shuffles: 1,
          shuffle_streak: 0,
          achievements_count: unlockedAchievements.length,
          updated_at: new Date().toISOString(),
        },
      ])
    }

    return NextResponse.json({
      success: true,
      data: shuffleData,
      patternAchievements: patternBasedAchievements,
    })
  } catch (error) {
    console.error('Unexpected error saving shuffle:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
