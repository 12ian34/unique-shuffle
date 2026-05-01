import { db } from '@/lib/db'
import { globalStats, publicSharedShuffles } from '@/lib/db/schema'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { ErrorType, ErrorSeverity, createError } from '@/lib/errors'
import { ensurePublicDataTables } from '@/lib/db/public-schema'

export async function GET() {
  try {
    await ensurePublicDataTables()

    const [globalCount] = await db.select({ count: globalStats.count }).from(globalStats).limit(1)
    const [{ count: sharedCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(publicSharedShuffles)

    return NextResponse.json({
      status: 'success',
      storage: 'local-first',
      globalCount: Number(globalCount?.count || 0),
      sharedShuffleCount: Number(sharedCount || 0),
    })
  } catch (error) {
    const appError = createError(
      'Debug API error',
      ErrorType.UNKNOWN,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'DEBUG_API_ERROR'
    )

    return NextResponse.json(
      {
        status: 'error',
        error: appError,
      },
      { status: 500 }
    )
  }
}
