import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/supabase'
import { generateUsername } from '@/utils/username-generator'
import { nanoid } from 'nanoid'
import { getUnlockedAchievements } from '@/lib/achievements'

type Card = {
  suit: string
  value: string
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // 1. Parse request data
    const requestData = await request.json()
    const { cards } = requestData

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'Cards must be an array' }, { status: 400 })
    }

    // 2. Authenticate the user - use getUser() instead of getSession() for improved security
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
    console.log('Saving shuffle for user:', userId)

    // Generate a unique share code for this shuffle
    const shareCode = nanoid(10)

    // Save the shuffle directly to global_shuffles
    const { data: shuffleData, error: shuffleError } = await supabaseAdmin
      .from('global_shuffles')
      .insert([
        {
          user_id: userId,
          cards,
          is_saved: true,
          share_code: shareCode,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    // If there's a foreign key error, we need to create the user first
    if (shuffleError && shuffleError.code === '23503') {
      console.log('Foreign key error, creating user record first')

      // Create user record
      const { error: userCreateError } = await supabaseAdmin.from('users').insert([
        {
          id: userId,
          email: user.email,
          created_at: new Date().toISOString(),
        },
      ])

      if (userCreateError) {
        console.error('Failed to create user record:', userCreateError)
        return NextResponse.json(
          { error: 'Failed to create user record', details: userCreateError.message },
          { status: 500 }
        )
      }

      // Try to save the shuffle again
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('global_shuffles')
        .insert([
          {
            user_id: userId,
            cards,
            is_saved: true,
            share_code: shareCode,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (retryError) {
        console.error('Still failed to save shuffle after user creation:', retryError)
        return NextResponse.json(
          { error: 'Still failed to save shuffle', details: retryError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: retryData })
    }

    // If there was a different error, return it
    if (shuffleError) {
      console.error('Failed to save shuffle:', shuffleError)
      return NextResponse.json(
        { error: 'Failed to save shuffle', details: shuffleError.message },
        { status: 500 }
      )
    }

    // 5. Success case

    // Update leaderboard with the new shuffle count
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

    return NextResponse.json({ success: true, data: shuffleData })
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
