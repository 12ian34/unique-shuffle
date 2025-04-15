import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { ErrorType, ErrorSeverity, createError, createDatabaseError } from '@/lib/errors'

// Force dynamic execution to prevent caching and ensure cookies are read
export const dynamic = 'force-dynamic'

// Fetch the global shuffle count
export async function GET() {
  try {
    // Get the sum of total_shuffles from all users
    const { data: globalCountData, error: globalCountError } = await supabaseAdmin
      .from('users')
      .select('total_shuffles')

    if (globalCountError) {
      const appError = createDatabaseError('Failed to fetch global shuffle sum', {
        originalError: globalCountError,
      })
      return NextResponse.json({ error: appError }, { status: 500 })
    }

    // Calculate the sum
    const count = globalCountData?.reduce((sum, user) => sum + (user.total_shuffles || 0), 0) || 0

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
