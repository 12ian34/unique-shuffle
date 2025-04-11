import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sortBy = searchParams.get('sortBy') || 'total_shuffles'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 10

  // Validate sortBy to prevent SQL injection
  const validColumns = ['total_shuffles', 'shuffle_streak', 'achievements_count', 'username']
  const column = validColumns.includes(sortBy) ? sortBy : 'total_shuffles'

  // Validate sortOrder
  const ascending = sortOrder === 'asc'

  const supabaseAdmin = createSupabaseAdmin()

  try {
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .order(column, { ascending })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ entries: data })
  } catch (error) {
    console.error('Unexpected error fetching leaderboard:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
