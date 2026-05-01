import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shuffles } from '@/lib/db/schema'
import { toDbShuffle } from '@/lib/db/mappers'
import { eq, isNotNull, sql } from 'drizzle-orm'
import { ErrorType, ErrorSeverity, createError, createValidationError } from '@/lib/errors'

// Verify if a shuffle exists
export async function GET(request: Request) {
  // Set CORS headers
  const origin = request.headers.get('origin') || ''
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers, status: 204 })
  }

  // Parse the URL and get the code parameter
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    const error = createValidationError('Missing code parameter', {
      requiredParams: ['code'],
    })
    return NextResponse.json({ error, exists: false }, { status: 400, headers })
  }

  try {
    // Create diagnostics object to track verification attempts
    const diagnostics = {
      code,
      byId: { attempted: false, found: false },
      byShareCode: { attempted: false, found: false },
      totalShuffles: 0,
      shufflesWithShareCodes: 0,
      isUuid: false,
    }

    // Check if code matches UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    diagnostics.isUuid = uuidRegex.test(code)

    // First try by ID
    diagnostics.byId.attempted = diagnostics.isUuid
    const [shuffleById] = diagnostics.isUuid
      ? await db.select().from(shuffles).where(eq(shuffles.id, code)).limit(1)
      : []

    diagnostics.byId.found = !!shuffleById

    let existingShuffleData = shuffleById

    // If not found by ID, try by share_code
    if (!shuffleById) {
      diagnostics.byShareCode.attempted = true
      const [shuffleByShareCode] = await db
        .select()
        .from(shuffles)
        .where(eq(shuffles.shareCode, code))
        .limit(1)

      diagnostics.byShareCode.found = !!shuffleByShareCode

      existingShuffleData = shuffleByShareCode
    }

    // Get some stats about the database
    const [{ count: totalShuffles }] = await db.select({ count: sql<number>`count(*)` }).from(shuffles)

    diagnostics.totalShuffles = totalShuffles || 0

    const [{ count: shufflesWithShareCodes }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shuffles)
      .where(isNotNull(shuffles.shareCode))

    diagnostics.shufflesWithShareCodes = shufflesWithShareCodes || 0

    // Return the verification result with diagnostics
    return NextResponse.json(
      {
        exists: !!existingShuffleData,
        diagnostics,
        shuffle: existingShuffleData ? toDbShuffle(existingShuffleData) : null,
      },
      { headers }
    )
  } catch (error) {
    const appError = createError(
      'Failed to verify shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_VERIFY_ERROR'
    )
    return NextResponse.json({ error: appError, exists: false }, { status: 500, headers })
  }
}
