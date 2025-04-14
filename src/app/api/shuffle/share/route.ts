import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateRandomString } from '@/lib/utils'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createAuthError,
  createValidationError,
} from '@/lib/errors'

// Share a shuffle
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { shuffleId } = await request.json()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    if (!shuffleId) {
      return NextResponse.json(
        {
          error: createValidationError('Missing shuffleId parameter', { param: 'shuffleId' }),
        },
        { status: 400 }
      )
    }

    // Get the shuffle to check if it belongs to the user
    const { data: shuffle } = await supabase
      .from('shuffles')
      .select('*')
      .eq('id', shuffleId)
      .single()

    if (!shuffle) {
      return NextResponse.json(
        {
          error: createError(
            'Shuffle not found',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { shuffleId },
            'RESOURCE_NOT_FOUND'
          ),
        },
        { status: 404 }
      )
    }

    if (shuffle.user_id !== user.id) {
      return NextResponse.json(
        {
          error: createAuthError('Not authorized to share this shuffle', {
            shuffleId,
            userId: user.id,
          }),
        },
        { status: 403 }
      )
    }

    // If the shuffle is already shared, just return it
    if (shuffle.is_shared && shuffle.share_code) {
      return NextResponse.json({
        success: true,
        shareCode: shuffle.share_code,
        shuffle,
      })
    }

    // Generate a share code if none exists
    const shareCode = shuffle.share_code || generateRandomString(10)

    // Update the shuffle to mark it as shared
    const { data: updatedShuffle, error } = await supabase
      .from('shuffles')
      .update({
        is_shared: true,
        share_code: shareCode,
      })
      .eq('id', shuffleId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: createError(
            'Failed to update shuffle sharing status',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { supabaseError: error },
            'DATABASE_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    // Create a shared_shuffles record if it doesn't exist
    const { error: sharedError } = await supabase.from('shared_shuffles').upsert(
      {
        shuffle_id: shuffleId,
        views: 0,
        last_viewed_at: new Date().toISOString(),
      },
      {
        onConflict: 'shuffle_id',
        ignoreDuplicates: true,
      }
    )

    if (sharedError) {
      return NextResponse.json(
        {
          error: createError(
            'Failed to create shared shuffle record',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { supabaseError: sharedError },
            'DATABASE_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shareCode,
      shuffle: updatedShuffle,
    })
  } catch (error) {
    console.error('Error sharing shuffle:', error)
    const appError = createError(
      'Failed to share shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_SHARE_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
