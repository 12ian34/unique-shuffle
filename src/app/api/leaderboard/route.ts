import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { achievements, friends, userProfiles } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import { LEADERBOARD_PAGE_SIZE } from '@/lib/constants'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
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

    const user = await getCurrentUser()

    // Get friends if filtering by friends only
    let friendIds: string[] = []
    if (friendsOnly && user) {
      // Get accepted friendships where the user is either the requester or the recipient
      const friendships = await db
        .select({ userId: friends.userId, friendId: friends.friendId })
        .from(friends)
        .where(
          and(
            eq(friends.status, 'accepted'),
            or(eq(friends.userId, user.id), eq(friends.friendId, user.id))
          )
        )

      // Extract friend IDs
      if (friendships && friendships.length > 0) {
        friendIds = friendships.map((friendship) =>
          friendship.userId === user.id ? friendship.friendId : friendship.userId
        )
      }

      // Include current user in the results
      friendIds.push(user.id)
    }

    if (friendsOnly && friendIds.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const achievementCount = sql<number>`count(distinct ${achievements.achievementId})`
    const conditions = friendsOnly ? inArray(userProfiles.id, friendIds) : undefined
    const orderBy =
      sortBy === 'achievementCount'
        ? desc(achievementCount)
        : sortBy === 'shuffle_streak'
        ? desc(userProfiles.shuffleStreak)
        : desc(userProfiles.totalShuffles)

    const users = await db
      .select({
        userId: userProfiles.id,
        username: userProfiles.username,
        totalShuffles: userProfiles.totalShuffles,
        shuffleStreak: userProfiles.shuffleStreak,
        achievementCount,
      })
      .from(userProfiles)
      .leftJoin(achievements, eq(userProfiles.id, achievements.userId))
      .where(conditions)
      .groupBy(userProfiles.id)
      .orderBy(orderBy, asc(userProfiles.username))
      .limit(LEADERBOARD_PAGE_SIZE)
      .offset((page - 1) * LEADERBOARD_PAGE_SIZE)

    const leaderboard = users.map((entry) => ({
      ...entry,
      achievementCount: Number(entry.achievementCount || 0),
    }))

    return NextResponse.json({ data: leaderboard }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('syntax')) {
      const appError = createDatabaseError('Failed to fetch leaderboard data', {
        originalError: error.message,
      })
      handleError(appError)
      return NextResponse.json({ error: appError }, { status: 500 })
    }
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
