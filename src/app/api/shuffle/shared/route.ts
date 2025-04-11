import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shareCode = searchParams.get('code')

  // Skip processing if it's a timestamp parameter or cache-busting parameter
  if (searchParams.has('t') || searchParams.has('_') || searchParams.has('timestamp')) {
    return NextResponse.json({ skip: true, message: 'Timestamp parameter detected, skipping' })
  }

  if (!shareCode) {
    return NextResponse.json({ error: 'Share code is required' }, { status: 400 })
  }

  // Make sure the share code is properly decoded from URL encoding
  const decodedShareCode = decodeURIComponent(shareCode)
  console.log('Original share code:', shareCode)
  console.log('Decoded share code:', decodedShareCode)

  const supabaseAdmin = createSupabaseAdmin()

  try {
    console.log('Looking for shuffle with share_code:', decodedShareCode)

    // First check if there's any shuffle with this share_code regardless of is_shared status
    const { data: anyShuffles, error: checkError } = await supabaseAdmin
      .from('global_shuffles')
      .select('id, share_code, is_shared')
      .eq('share_code', decodedShareCode)

    if (checkError) {
      console.error('Error checking for any shuffle with share_code:', checkError)
    } else {
      console.log(
        'Found shuffles with this share_code (regardless of is_shared flag):',
        anyShuffles
      )
    }

    // Get the shared shuffle
    const { data: shuffle, error } = await supabaseAdmin
      .from('global_shuffles')
      .select('id, cards, created_at, user_id, is_shared')
      .eq('share_code', decodedShareCode)
      .eq('is_shared', true)
      .single()

    if (error) {
      console.error('Error fetching shared shuffle:', error)
      console.log('Attempted to fetch shuffle with share_code:', decodedShareCode)

      // If any shuffles were found but they aren't shared, that's helpful debugging info
      if (anyShuffles && anyShuffles.length > 0) {
        console.log('Note: Found shuffle(s) with this share_code but is_shared is not true')
      }

      return NextResponse.json({ error: 'Shared shuffle not found' }, { status: 404 })
    }

    return NextResponse.json({ shuffle })
  } catch (error) {
    console.error('Unexpected error fetching shared shuffle:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
