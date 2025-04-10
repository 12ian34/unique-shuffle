import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { Database } from '@/types/supabase'

type Card = {
  suit: string
  value: string
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // 1. Parse request data
    const requestData = await request.json()
    const { cards } = requestData

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'Cards must be an array' }, { status: 400 })
    }

    // 2. Authenticate the user - use getUser() instead of getSession() for improved security
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
    console.log('Saving shuffle for user:', userId)

    // 3. Try to directly save the shuffle first
    const { data: shuffleData, error: shuffleError } = await supabaseAdmin
      .from('shuffles')
      .insert([{ user_id: userId, cards }])
      .select()

    // 4. If there's a foreign key error, we need to create the user first
    if (shuffleError && shuffleError.code === '23503') {
      console.log('Foreign key error, creating user record first')

      // Create user record
      const { error: userCreateError } = await supabaseAdmin.from('users').insert([
        {
          id: userId,
          email: user.email,
          created_at: new Date().toISOString(),
        },
      ])

      if (userCreateError) {
        console.error('Failed to create user record:', userCreateError)
        return NextResponse.json(
          { error: 'Failed to create user record', details: userCreateError.message },
          { status: 500 }
        )
      }

      // Try to save the shuffle again
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('shuffles')
        .insert([{ user_id: userId, cards }])
        .select()

      if (retryError) {
        console.error('Still failed to save shuffle after user creation:', retryError)
        return NextResponse.json(
          { error: 'Still failed to save shuffle', details: retryError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: retryData })
    }

    // If there was a different error, return it
    if (shuffleError) {
      console.error('Failed to save shuffle:', shuffleError)
      return NextResponse.json(
        { error: 'Failed to save shuffle', details: shuffleError.message },
        { status: 500 }
      )
    }

    // 5. Success case
    return NextResponse.json({ success: true, data: shuffleData })
  } catch (error) {
    console.error('Unexpected error saving shuffle:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
