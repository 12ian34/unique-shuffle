import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { ErrorType, ErrorSeverity, createError } from '@/lib/errors'

// Force dynamic execution to prevent caching and ensure cookies are read
export const dynamic = 'force-dynamic'

// Fetch the global shuffle count
export async function GET() {
  try {
    // Get the sum of total_shuffles from all users
    const [globalCountData] = await db
      .select({ count: sql<number>`coalesce(sum(${userProfiles.totalShuffles}), 0)` })
      .from(userProfiles)

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
