import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get user profile from auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError) {
      console.error('Error fetching auth user:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Get user profile from leaderboard
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      user: authUser?.user || null,
      profile: profile || null
    })
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const requestData = await request.json()
  const { userId, username, email, password } = requestData

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createSupabaseAdmin()
  const updates: Record<string, any> = {}
  let authUpdated = false
  let profileUpdated = false

  try {
    // Update username if provided
    if (username) {
      // Validate username
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 20 characters' },
          { status: 400 }
        )
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, and underscores' },
          { status: 400 }
        )
      }

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

      // Update username in leaderboard
      const { error: updateError } = await supabaseAdmin
        .from('leaderboard')
        .update({ username })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating username:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      updates.username = username
      profileUpdated = true
    }

    // Update email if provided
    if (email) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      )

      if (updateError) {
        console.error('Error updating email:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      updates.email = email
      authUpdated = true
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (updateError) {
        console.error('Error updating password:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      updates.password = '********' // Don't return actual password
      authUpdated = true
    }

    return NextResponse.json({ 
      success: true, 
      updated: updates,
      authUpdated,
      profileUpdated
    })
  } catch (error) {
    console.error('Unexpected error updating user profile:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 