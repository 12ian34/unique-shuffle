import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { ErrorType, ErrorSeverity, createError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await getCurrentUser()

    // Test querying a table
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(userProfiles)

    return NextResponse.json({
      status: 'success',
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      userCount: Number(userCount?.count || 0),
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
