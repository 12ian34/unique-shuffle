import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publicSharedShuffles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ErrorSeverity, ErrorType, createError, createValidationError } from '@/lib/errors'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { error: createValidationError('Missing code parameter', { requiredParams: ['code'] }), exists: false },
      { status: 400 }
    )
  }

  try {
    const [sharedShuffle] = await db
      .select({ shareCode: publicSharedShuffles.shareCode })
      .from(publicSharedShuffles)
      .where(eq(publicSharedShuffles.shareCode, code))
      .limit(1)

    return NextResponse.json({
      exists: !!sharedShuffle,
      shareCode: sharedShuffle?.shareCode || null,
    })
  } catch (error) {
    const appError = createError(
      'Failed to verify shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_VERIFY_ERROR'
    )

    return NextResponse.json({ error: appError, exists: false }, { status: 500 })
  }
}
