import { NextResponse } from 'next/server'
import { generateRandomString } from '@/lib/utils'
import { db } from '@/lib/db'
import { sharedShuffles, shuffles } from '@/lib/db/schema'
import { toDbShuffle } from '@/lib/db/mappers'
import { getCurrentUser } from '@/lib/auth/session'
import { and, eq } from 'drizzle-orm'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createAuthError,
  createValidationError,
} from '@/lib/errors'

// Share a shuffle
export async function POST(request: Request) {
  try {
    const { shuffleId } = await request.json()

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    if (!shuffleId) {
      return NextResponse.json(
        {
          error: createValidationError('Missing shuffleId parameter', { param: 'shuffleId' }),
        },
        { status: 400 }
      )
    }

    // Get the shuffle to check if it belongs to the user
    const [shuffle] = await db.select().from(shuffles).where(eq(shuffles.id, shuffleId)).limit(1)

    if (!shuffle) {
      return NextResponse.json(
        {
          error: createError(
            'Shuffle not found',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { shuffleId },
            'RESOURCE_NOT_FOUND'
          ),
        },
        { status: 404 }
      )
    }

    if (shuffle.userId !== user.id) {
      return NextResponse.json(
        {
          error: createAuthError('Not authorized to share this shuffle', {
            shuffleId,
            userId: user.id,
          }),
        },
        { status: 403 }
      )
    }

    // If the shuffle is already shared, just return it
    if (shuffle.isShared && shuffle.shareCode) {
      return NextResponse.json({
        success: true,
        shareCode: shuffle.shareCode,
        shuffle: toDbShuffle(shuffle),
      })
    }

    // Use the existing share_code if it exists, or generate a new one
    const shareCode = shuffle.shareCode || generateRandomString(10)

    // Update the shuffle to mark it as shared
    const [updatedShuffle] = await db
      .update(shuffles)
      .set({
        isShared: true,
        shareCode,
      })
      .where(and(eq(shuffles.id, shuffleId), eq(shuffles.userId, user.id)))
      .returning()

    // Create a shared_shuffles record if it doesn't exist
    await db
      .insert(sharedShuffles)
      .values({
        shuffleId,
        views: 0,
        lastViewedAt: new Date().toISOString(),
      })
      .onConflictDoNothing()

    return NextResponse.json({
      success: true,
      shareCode,
      shuffle: toDbShuffle(updatedShuffle),
    })
  } catch (error) {
    const appError = createError(
      'Failed to share shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_SHARE_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
