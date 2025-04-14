import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { ErrorType, ErrorSeverity, createError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Test authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Test querying a table
    const { data: userCount, error: userError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true })

    return NextResponse.json({
      status: 'success',
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      userCount,
      authError: authError?.message,
      userError: userError?.message,
    })
  } catch (error) {
    console.error('API debug error:', error)
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
