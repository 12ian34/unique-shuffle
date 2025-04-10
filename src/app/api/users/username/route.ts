import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(request: Request) {
  const requestData = await request.json()
  const { userId, username } = requestData

  if (!userId || !username) {
    return NextResponse.json(
      { error: 'userId and username are required' },
      { status: 400 }
    )
  }

  // Check username length
  if (username.length < 3 || username.length > 20) {
    return NextResponse.json(
      { error: 'Username must be between 3 and 20 characters' },
      { status: 400 }
    )
  }

  // Check for valid characters (alphanumeric and underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: 'Username can only contain letters, numbers, and underscores' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Check if username is already taken
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('leaderboard')
      .select('user_id')
      .eq('username', username)
      .neq('user_id', userId)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Update the username in the leaderboard
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .update({ username })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating username:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error updating username:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 