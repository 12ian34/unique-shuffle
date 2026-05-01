import { NextResponse } from 'next/server'
import { generateRandomString } from '@/lib/utils'
import { db } from '@/lib/db'
import { shuffles } from '@/lib/db/schema'
import { toDbShuffle } from '@/lib/db/mappers'
import { getCurrentUser } from '@/lib/auth/session'
import { and, desc, eq } from 'drizzle-orm'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createAuthError,
  createValidationError,
} from '@/lib/errors'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: createAuthError('Authentication required') }, { status: 401 })
    }

    const savedShuffles = await db
      .select()
      .from(shuffles)
      .where(and(eq(shuffles.userId, user.id), eq(shuffles.isSaved, true)))
      .orderBy(desc(shuffles.createdAt))

    return NextResponse.json({ data: savedShuffles.map(toDbShuffle) })
  } catch (error) {
    const appError = createError(
      'Failed to fetch saved shuffles',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_FETCH_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}

// Save or unsave a shuffle
export async function POST(request: Request) {
  try {
    const { shuffleId, isSaved } = await request.json()

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          error: createAuthError('Authentication required'),
        },
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
          error: createAuthError('Not authorized to modify this shuffle', {
            shuffleId,
            userId: user.id,
          }),
        },
        { status: 403 }
      )
    }

    // Update is_saved status
    const updateData: { isSaved: boolean; shareCode?: string } = {
      isSaved,
    }

    // If we're saving the shuffle and it doesn't have a share code, generate one
    if (isSaved && !shuffle.shareCode) {
      updateData.shareCode = generateRandomString(10)
    }

    const [updatedShuffle] = await db
      .update(shuffles)
      .set(updateData)
      .where(and(eq(shuffles.id, shuffleId), eq(shuffles.userId, user.id)))
      .returning()

    return NextResponse.json({
      success: true,
      shuffle: toDbShuffle(updatedShuffle),
    })
  } catch (error) {
    const appError = createError(
      'Failed to save shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_SAVE_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
