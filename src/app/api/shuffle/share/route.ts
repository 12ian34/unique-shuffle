import { NextResponse } from 'next/server'
import { generateRandomString } from '@/lib/utils'
import { db } from '@/lib/db'
import { publicSharedShuffles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createValidationError,
} from '@/lib/errors'

// Share a shuffle
export async function POST(request: Request) {
  try {
    const { cards, patterns = [], achievementIds = [], displayName, profileId } = await request.json()

    if (!Array.isArray(cards) || cards.length !== 52) {
      return NextResponse.json(
        {
          error: createValidationError('A 52-card shuffle is required to share', {
            providedLength: Array.isArray(cards) ? cards.length : 0,
          }),
        },
        { status: 400 }
      )
    }

    const shareCode = generateRandomString(10)
    const profileHash =
      typeof profileId === 'string' && profileId.length > 0 ? profileId.slice(0, 8) : null

    await db
      .insert(publicSharedShuffles)
      .values({
        shareCode,
        cards,
        patterns,
        achievementIds,
        displayName: typeof displayName === 'string' ? displayName.slice(0, 40) : null,
        profileHash,
        createdAt: new Date().toISOString(),
        views: 0,
      })
      .onConflictDoNothing()

    const [sharedShuffle] = await db
      .select()
      .from(publicSharedShuffles)
      .where(eq(publicSharedShuffles.shareCode, shareCode))
      .limit(1)

    if (!sharedShuffle) {
      throw new Error('Failed to create shared shuffle')
    }

    return NextResponse.json({
      success: true,
      shareCode: sharedShuffle.shareCode,
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: createValidationError('Missing code parameter', { param: 'code' }) },
        { status: 400 }
      )
    }

    const [sharedShuffle] = await db
      .select()
      .from(publicSharedShuffles)
      .where(eq(publicSharedShuffles.shareCode, code))
      .limit(1)

    if (!sharedShuffle) {
      return NextResponse.json(
        {
          error: createError(
            'Shared shuffle not found',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { code },
            'RESOURCE_NOT_FOUND'
          ),
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        shareCode: sharedShuffle.shareCode,
        cards: sharedShuffle.cards,
        patterns: sharedShuffle.patterns,
        achievementIds: sharedShuffle.achievementIds,
        displayName: sharedShuffle.displayName,
        profileHash: sharedShuffle.profileHash,
        createdAt: sharedShuffle.createdAt,
        views: sharedShuffle.views,
      },
    })
  } catch (error) {
    const appError = createError(
      'Failed to fetch shared shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_SHARE_FETCH_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
