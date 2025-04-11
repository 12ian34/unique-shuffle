import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shareCode = searchParams.get('code')

  if (!shareCode) {
    return NextResponse.json({ error: 'Share code is required' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Get the shared shuffle
    const { data: shuffle, error } = await supabaseAdmin
      .from('global_shuffles')
      .select('id, cards, created_at, user_id, is_shared')
      .eq('share_code', shareCode)
      .eq('is_shared', true)
      .single()

    if (error) {
      console.error('Error fetching shared shuffle:', error)
      return NextResponse.json({ error: 'Shared shuffle not found' }, { status: 404 })
    }

    // Record view in analytics
    await supabaseAdmin
      .from('shuffle_analytics')
      .insert([
        {
          shuffle_id: parseInt(shuffle.id, 10),
          action: 'view',
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    return NextResponse.json({ shuffle })
  } catch (error) {
    console.error('Unexpected error fetching shared shuffle:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
