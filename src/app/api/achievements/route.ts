import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { updateUserAchievements, getUnlockedAchievements } from '@/lib/achievements'
import { UserStats } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get user stats from leaderboard
    const { data: userStats, error } = await supabaseAdmin
      .from('leaderboard')
      .select('total_shuffles, shuffle_streak, achievements_count')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user stats:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Calculate achievements based on stats
    const achievements = getUnlockedAchievements({
      total_shuffles: userStats.total_shuffles,
      shuffle_streak: userStats.shuffle_streak,
      achievements_count: userStats.achievements_count,
      most_common_cards: [],
    } as UserStats)

    return NextResponse.json({
      achievements,
      count: achievements.length,
      stats: userStats,
    })
  } catch (error) {
    console.error('Unexpected error fetching achievements:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const requestData = await request.json()
  const { userId } = requestData

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get user stats from leaderboard
    const { data: userStats, error } = await supabaseAdmin
      .from('leaderboard')
      .select('total_shuffles, shuffle_streak, achievements_count')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user stats:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update achievements
    const { achievements, updated } = await updateUserAchievements(supabaseAdmin, userId, {
      total_shuffles: userStats.total_shuffles,
      shuffle_streak: userStats.shuffle_streak,
      achievements_count: userStats.achievements_count,
      most_common_cards: [],
    } as UserStats)

    return NextResponse.json({
      achievements,
      count: achievements.length,
      updated,
    })
  } catch (error) {
    console.error('Unexpected error updating achievements:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
