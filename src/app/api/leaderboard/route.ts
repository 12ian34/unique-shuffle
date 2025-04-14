import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import supabaseAdmin from '@/lib/supabase-admin'
import { LEADERBOARD_PAGE_SIZE } from '@/lib/constants'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createDatabaseError,
  createValidationError,
  handleError,
} from '@/lib/errors'

// Valid database columns that can be used for sorting
const VALID_DB_SORT_COLUMNS = ['total_shuffles', 'shuffle_streak']

// Get leaderboard data
export async function GET(request: Request) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort') || 'total_shuffles'
    const friendsOnly = searchParams.get('friendsOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)

    // Validate page number
    if (isNaN(page) || page < 1) {
      const error = createValidationError('Invalid page parameter. Must be a positive integer.', {
        providedPage: searchParams.get('page'),
      })
      return NextResponse.json({ error }, { status: 400 })
    }

    // Validate sort parameter
    if (sortBy !== 'achievementCount' && !VALID_DB_SORT_COLUMNS.includes(sortBy)) {
      const error = createValidationError('Invalid sort parameter', {
        providedSort: sortBy,
        validOptions: [...VALID_DB_SORT_COLUMNS, 'achievementCount'],
      })
      return NextResponse.json({ error }, { status: 400 })
    }

    // Get the current user for friends filtering
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get friends if filtering by friends only
    let friendIds: string[] = []
    if (friendsOnly && user) {
      // Get accepted friendships where the user is either the requester or the recipient
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendshipsError) {
        const error = createDatabaseError('Failed to fetch friends data', {
          originalError: friendshipsError,
        })
        handleError(error)
        return NextResponse.json({ error }, { status: 500 })
      }

      // Extract friend IDs
      if (friendships && friendships.length > 0) {
        friendIds = friendships.map((friendship) =>
          friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
        )
      }

      // Include current user in the results
      friendIds.push(user.id)
    }

    // Get users with their shuffle stats
    let query = supabaseAdmin.from('users').select('id, username, total_shuffles, shuffle_streak')

    // Apply friends filter if needed
    if (friendsOnly && friendIds.length > 0) {
      query = query.in('id', friendIds)
    }

    // Only apply database sorting for columns that exist in the database
    // For achievementCount we'll sort in-memory after fetching
    if (VALID_DB_SORT_COLUMNS.includes(sortBy)) {
      query = query.order(sortBy as any, { ascending: false })
    } else {
      // Default sort if the requested sort column doesn't exist in DB
      query = query.order('total_shuffles', { ascending: false })
    }

    const { data: users, error: usersError } = await query
      .limit(LEADERBOARD_PAGE_SIZE)
      .range((page - 1) * LEADERBOARD_PAGE_SIZE, page * LEADERBOARD_PAGE_SIZE - 1)

    if (usersError || !users) {
      const error = createDatabaseError('Failed to fetch users data', {
        originalError: usersError || 'No users returned',
      })
      handleError(error)
      return NextResponse.json({ error }, { status: 500 })
    }

    // Get all user IDs to fetch achievement counts
    const userIds = users.map((user) => user.id)

    // Get all achievements for these users
    const { data: achievements, error: achievementsError } = await supabaseAdmin
      .from('achievements')
      .select('user_id, achievement_id')
      .in('user_id', userIds)

    if (achievementsError) {
      const error = createDatabaseError('Failed to fetch achievements data', {
        originalError: achievementsError,
      })
      handleError(error)
      return NextResponse.json({ error }, { status: 500 })
    }

    // Count unique achievement types per user
    const achievementCounts: Record<string, number> = {}
    if (achievements) {
      // Create a Set of unique achievement_ids per user
      const uniqueAchievementsByUser: Record<string, Set<string>> = {}

      achievements.forEach((achievement) => {
        const userId = achievement.user_id
        const achievementId = achievement.achievement_id

        if (!uniqueAchievementsByUser[userId]) {
          uniqueAchievementsByUser[userId] = new Set()
        }

        uniqueAchievementsByUser[userId].add(achievementId)
      })

      // Count the size of each Set to get unique achievement count
      Object.entries(uniqueAchievementsByUser).forEach(([userId, achievementSet]) => {
        achievementCounts[userId] = achievementSet.size
      })
    }

    // Transform data to match LeaderboardEntry type
    let leaderboard = users.map((user) => ({
      userId: user.id,
      username: user.username,
      totalShuffles: user.total_shuffles,
      shuffleStreak: user.shuffle_streak,
      achievementCount: achievementCounts[user.id] || 0,
    }))

    // Sort based on requested field if not already sorted by database
    if (sortBy === 'achievementCount') {
      leaderboard.sort((a, b) => b.achievementCount - a.achievementCount)
    }

    return NextResponse.json({ data: leaderboard }, { status: 200 })
  } catch (error) {
    // Use our structured error handling
    const appError = createError(
      'Failed to fetch leaderboard data',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'LEADERBOARD_ERROR'
    )

    // Log the structured error
    handleError(appError)

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
