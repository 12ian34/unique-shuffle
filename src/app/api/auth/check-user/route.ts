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
    // Check if user exists in auth.users
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (error) {
      console.error('Error checking user:', error)
      return NextResponse.json({ 
        error: error.message,
        exists: false,
        user: null
      }, { status: 400 })
    }

    return NextResponse.json({ 
      exists: !!data.user,
      user: data.user
    })
  } catch (error) {
    console.error('Unexpected error checking user:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', exists: false },
      { status: 500 }
    )
  }
} 