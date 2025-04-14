import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import supabaseAdmin from '@/lib/supabase-admin'
import { PostgrestError } from '@supabase/supabase-js'
import { ErrorType, ErrorSeverity, createError, createValidationError } from '@/lib/errors'

// Verify if a shuffle exists
export async function GET(request: Request) {
  console.log('📥 Received shuffle verification request')

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
      byId: { attempted: false, found: false, error: null as PostgrestError | null },
      byShareCode: { attempted: false, found: false, error: null as PostgrestError | null },
      totalShuffles: 0,
      shufflesWithShareCodes: 0,
      isUuid: false,
    }

    // Check if code matches UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    diagnostics.isUuid = uuidRegex.test(code)

    // Use admin client for the verification
    const supabase = supabaseAdmin

    // First try by ID
    diagnostics.byId.attempted = true
    let { data: shuffleById, error: idError } = await supabase
      .from('shuffles')
      .select('id, is_saved, is_shared, share_code, created_at')
      .eq('id', code)
      .single()

    diagnostics.byId.found = !!shuffleById
    diagnostics.byId.error = idError

    let existingShuffleData = shuffleById

    // If not found by ID, try by share_code
    if (!shuffleById) {
      diagnostics.byShareCode.attempted = true
      const { data: shuffleByShareCode, error: shareCodeError } = await supabase
        .from('shuffles')
        .select('id, is_saved, is_shared, share_code, created_at')
        .eq('share_code', code)
        .single()

      diagnostics.byShareCode.found = !!shuffleByShareCode
      diagnostics.byShareCode.error = shareCodeError

      existingShuffleData = shuffleByShareCode
    }

    // Get some stats about the database
    const { count: totalShuffles } = await supabase
      .from('shuffles')
      .select('*', { count: 'exact', head: true })

    diagnostics.totalShuffles = totalShuffles || 0

    const { count: shufflesWithShareCodes } = await supabase
      .from('shuffles')
      .select('*', { count: 'exact', head: true })
      .not('share_code', 'is', null)

    diagnostics.shufflesWithShareCodes = shufflesWithShareCodes || 0

    // Return the verification result with diagnostics
    return NextResponse.json(
      {
        exists: !!existingShuffleData,
        diagnostics,
        shuffle: existingShuffleData || null,
      },
      { headers }
    )
  } catch (error) {
    console.error('Error verifying shuffle:', error)
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
