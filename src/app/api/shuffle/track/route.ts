import { NextResponse } from 'next/server'
import { checkAchievements } from '@/lib/achievements'
import { Achievement } from '@/types'
import { generateRandomString } from '@/lib/utils'
import { db } from '@/lib/db'
import { achievements as achievementsTable, shuffles, userProfiles } from '@/lib/db/schema'
import { toDbShuffle, toDbUser } from '@/lib/db/mappers'
import { ensureUserProfile } from '@/lib/auth/profile'
import { getCurrentUser } from '@/lib/auth/session'
import { getNextShuffleStats } from '@/lib/stats'
import { eq } from 'drizzle-orm'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createDatabaseError,
  createValidationError,
} from '@/lib/errors'

// Track a new shuffle
export async function POST(request: Request) {
  // Set CORS headers for credential-included requests
  const origin = request.headers.get('origin') || ''
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers, status: 204 })
  }

  try {
    const { cards } = await request.json()

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      const error = createValidationError('Invalid or empty cards data', {
        providedLength: cards?.length || 0,
      })
      return NextResponse.json({ error }, { status: 400, headers })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          saved: false,
          message: 'Anonymous shuffle - not saved to profile',
        },
        { headers }
      )
    }

    const profile = await ensureUserProfile(user)
    const nextStats = getNextShuffleStats(profile)
    const shuffleCount = nextStats.totalShuffles

    // Save the shuffle
    const [shuffle] = await db
      .insert(shuffles)
      .values({
        userId: user.id,
        cards,
        isShared: true,
        shareCode: generateRandomString(10),
      })
      .returning()

    // Check for achievements
    let achievements: Achievement[] = []
    if (cards) {
      achievements = checkAchievements(cards, shuffleCount)

      // Save earned achievements
      if (achievements.length > 0 && user) {
        for (const achievement of achievements) {
          try {
            await db
              .insert(achievementsTable)
              .values({
                userId: user.id,
                achievementId: achievement.id,
                shuffleId: shuffle.id,
              })
              .onConflictDoNothing()
          } catch (insertError) {
            console.error('Error saving achievement:', {
              achievementId: achievement.id,
              insertError,
            })
          }
        }
      }
    }

    // Update user stats
    const [updatedUser] = await db
      .update(userProfiles)
      .set(nextStats)
      .where(eq(userProfiles.id, user.id))
      .returning()

    return NextResponse.json(
      {
        success: true,
        saved: true,
        shuffle: toDbShuffle(shuffle),
        shuffleCount,
        achievements,
        userStats: toDbUser(updatedUser),
      },
      { headers }
    )
  } catch (error) {
    const appError = createError(
      'Failed to track shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_TRACK_ERROR'
    )
    return NextResponse.json({ error: appError }, { status: 500, headers })
  }
}
