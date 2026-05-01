import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { globalStats } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { ErrorType, ErrorSeverity, createError } from '@/lib/errors'
import { ensurePublicDataTables } from '@/lib/db/public-schema'

// Force dynamic execution to prevent caching and ensure cookies are read
export const dynamic = 'force-dynamic'

// Fetch the global shuffle count
export async function GET() {
  try {
    await ensurePublicDataTables()

    const [globalCountData] = await db
      .select({ count: globalStats.count })
      .from(globalStats)
      .where(sql`${globalStats.id} = 'global'`)

    const count = Number(globalCountData?.count || 0)

    return NextResponse.json(
      {
        count,
      },
      { status: 200 }
    )
  } catch (error) {
    const appError = createError(
      'Failed to fetch global shuffle count',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'GLOBAL_COUNT_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}

export async function POST() {
  try {
    await ensurePublicDataTables()

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

    return NextResponse.json({ count: Number(globalCountData?.count || 0) }, { status: 200 })
  } catch (error) {
    const appError = createError(
      'Failed to increment global shuffle count',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'GLOBAL_COUNT_INCREMENT_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
