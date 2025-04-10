import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Parse request data
    const requestData = await request.json()
    const { shuffleId } = requestData

    if (!shuffleId) {
      return NextResponse.json({ error: 'shuffleId is required' }, { status: 400 })
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

    // Verify shuffle belongs to user
    const { data: shuffleData, error: fetchError } = await supabaseAdmin
      .from('shuffles')
      .select('*')
      .eq('id', shuffleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !shuffleData) {
      return NextResponse.json(
        { error: 'Shuffle not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Generate a share code if one doesn't exist
    if (!shuffleData.share_code) {
      const shareCode = nanoid(10) // Generate a short unique ID

      const { data: updatedShuffle, error: updateError } = await supabaseAdmin
        .from('shuffles')
        .update({ share_code: shareCode, is_shared: true })
        .eq('id', shuffleId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to generate share code', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        shareCode,
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/shared/${shareCode}`,
      })
    }

    // Return existing share code
    return NextResponse.json({
      success: true,
      shareCode: shuffleData.share_code,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/shared/${shuffleData.share_code}`,
    })
  } catch (error) {
    console.error('Unexpected error sharing shuffle:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
