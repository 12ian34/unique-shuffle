import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { updateUserAchievements, getUnlockedAchievements, ACHIEVEMENTS } from '@/lib/achievements'
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

    // Get pattern-based achievements from user_achievements table
    const { data: patternAchievements, error: patternError } = await supabaseAdmin
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    if (patternError) {
      console.error('Error fetching pattern achievements:', patternError)
      // Continue even if there's an error - we can still show count-based achievements
    }

    // Extract achievement IDs from pattern achievements
    const patternAchievementIds = (patternAchievements || []).map((item) => item.achievement_id)

    // Calculate count-based achievements based on stats
    const countBasedAchievements = getUnlockedAchievements({
      total_shuffles: userStats.total_shuffles,
      shuffle_streak: userStats.shuffle_streak,
      achievements_count: userStats.achievements_count,
      most_common_cards: [],
    } as UserStats)

    // Combine both types of achievements
    const countBasedAchievementIds = countBasedAchievements.map((achievement) => achievement.id)
    const uniqueAchievementSet = new Set([...countBasedAchievementIds, ...patternAchievementIds])
    const allAchievementIds = Array.from(uniqueAchievementSet)

    // Map IDs back to full achievement objects
    const allAchievements = allAchievementIds
      .map((id) => {
        return ACHIEVEMENTS.find((a) => a.id === id)
      })
      .filter(Boolean) // Remove any undefined entries

    return NextResponse.json({
      achievements: allAchievements,
      count: allAchievements.length,
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

    // Get pattern-based achievements from user_achievements table
    const { data: patternAchievements, error: patternError } = await supabaseAdmin
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    if (patternError) {
      console.error('Error fetching pattern achievements:', patternError)
      // Continue even if there's an error - we can still update count-based achievements
    }

    // Extract achievement IDs from pattern achievements
    const patternAchievementIds = (patternAchievements || []).map((item) => item.achievement_id)

    // Calculate count-based achievements based on stats
    const countBasedAchievements = getUnlockedAchievements({
      total_shuffles: userStats.total_shuffles,
      shuffle_streak: userStats.shuffle_streak,
      achievements_count: userStats.achievements_count,
      most_common_cards: [],
    } as UserStats)

    // Combine both types of achievements
    const countBasedAchievementIds = countBasedAchievements.map((achievement) => achievement.id)
    const uniqueAchievementSet = new Set([...countBasedAchievementIds, ...patternAchievementIds])
    const allAchievementIds = Array.from(uniqueAchievementSet)

    // Map IDs back to full achievement objects
    const allAchievements = allAchievementIds
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
      .filter(Boolean) // Remove any undefined entries

    // Check if achievements count has changed and update leaderboard if needed
    if (allAchievements.length !== userStats.achievements_count) {
      const { error: updateError } = await supabaseAdmin
        .from('leaderboard')
        .update({ achievements_count: allAchievements.length })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating achievements count:', updateError)
        return NextResponse.json({
          achievements: allAchievements,
          count: allAchievements.length,
          updated: false,
        })
      }

      return NextResponse.json({
        achievements: allAchievements,
        count: allAchievements.length,
        updated: true,
      })
    }

    return NextResponse.json({
      achievements: allAchievements,
      count: allAchievements.length,
      updated: false,
    })
  } catch (error) {
    console.error('Unexpected error updating achievements:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
