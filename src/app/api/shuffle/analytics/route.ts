import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Parse request data
    const requestData = await request.json()
    const { shuffleId, action } = requestData

    if (!shuffleId) {
      return NextResponse.json({ error: 'shuffleId is required' }, { status: 400 })
    }

    if (!action || !['view', 'share', 'copy'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required' }, { status: 400 })
    }

    // Authenticate the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          details: userError?.message,
        },
        { status: 401 }
      )
    }

    const userId = user.id

    // Verify shuffle belongs to user if it's not a view action
    if (action !== 'view') {
      const { data: shuffleData, error: fetchError } = await supabaseAdmin
        .from('shuffles')
        .select('id')
        .eq('id', shuffleId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        return NextResponse.json(
          { error: 'Shuffle not found or does not belong to user' },
          { status: 404 }
        )
      }
    }

    // Record the analytics event
    const { data: analyticsData, error: analyticsError } = await supabaseAdmin
      .from('shuffle_analytics')
      .insert([
        {
          shuffle_id: shuffleId,
          user_id: userId,
          action,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (analyticsError) {
      console.error('Failed to record analytics:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to record analytics', details: analyticsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: analyticsData })
  } catch (error) {
    console.error('Unexpected error recording analytics:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
