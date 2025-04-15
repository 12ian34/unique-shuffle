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

// Save or unsave a shuffle
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { shuffleId, isSaved } = await request.json()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: createAuthError('Authentication required'),
        },
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
          error: createAuthError('Not authorized to modify this shuffle', {
            shuffleId,
            userId: user.id,
          }),
        },
        { status: 403 }
      )
    }

    // Update is_saved status
    const updateData: { is_saved: boolean; share_code?: string } = {
      is_saved: isSaved,
    }

    // If we're saving the shuffle and it doesn't have a share code, generate one
    if (isSaved && !shuffle.share_code) {
      updateData.share_code = generateRandomString(10)
    }

    const { data: updatedShuffle, error } = await supabase
      .from('shuffles')
      .update(updateData)
      .eq('id', shuffleId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: createError(
            'Database operation failed',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { supabaseError: error },
            'DATABASE_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shuffle: updatedShuffle,
    })
  } catch (error) {
    const appError = createError(
      'Failed to save shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_SAVE_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
