import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { globalStats } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { createValidationError, ErrorSeverity, ErrorType, createError } from '@/lib/errors'
import { ensurePublicDataTables } from '@/lib/db/public-schema'

export async function POST(request: Request) {
  try {
    await ensurePublicDataTables()

    const { cards } = await request.json()

    if (!Array.isArray(cards) || cards.length !== 52) {
      return NextResponse.json(
        {
          error: createValidationError('Invalid cards data', {
            providedLength: Array.isArray(cards) ? cards.length : 0,
          }),
        },
        { status: 400 }
      )
    }

    const [globalCountData] = await db
      .insert(globalStats)
      .values({
        id: 'global',
        count: 1,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: globalStats.id,
        set: {
          count: sql`${globalStats.count} + 1`,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning({ count: globalStats.count })

    return NextResponse.json({
      success: true,
      saved: false,
      storage: 'local',
      count: Number(globalCountData?.count || 0),
      message: 'Shuffle counted globally. Profile data is stored locally in the browser.',
    })
  } catch (error) {
    const appError = createError(
      'Failed to track shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_TRACK_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
