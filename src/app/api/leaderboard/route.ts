import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .order('total_shuffles', { ascending: false })

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ entries: data })
  } catch (error) {
    console.error('Unexpected error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 