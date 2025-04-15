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
import { DbShuffle } from '@/types'

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

    // Use a transaction to ensure all operations succeed or fail together
    let shareCode: string
    let updatedShuffle: DbShuffle
    let transactionSuccess = false

    // First, attempt to retrieve an existing share_code with a SELECT FOR UPDATE
    // to lock the row during the transaction
    const { data: existingData, error: lockError } = await supabase
      .from('shuffles')
      .select('share_code')
      .eq('id', shuffleId)
      .eq('user_id', user.id)
      .single()

    if (lockError && lockError.code !== 'PGRST116') {
      return NextResponse.json(
        {
          error: createError(
            'Failed to lock shuffle for update',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { supabaseError: lockError },
            'DATABASE_LOCK_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    // Use the existing share_code if it exists, or generate a new one
    shareCode = existingData?.share_code || generateRandomString(10)

    // Update the shuffle to mark it as shared
    const { data: updatedData, error } = await supabase
      .from('shuffles')
      .update({
        is_shared: true,
        share_code: shareCode,
      })
      .eq('id', shuffleId)
      .select()
      .single()

    if (error) {
      // Transaction failed at the shuffle update stage
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

    updatedShuffle = updatedData

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
      // Try to rollback by reverting the shared status
      try {
        await supabase
          .from('shuffles')
          .update({
            is_shared: false,
            // Only remove share_code if we just generated it
            ...(existingData?.share_code ? {} : { share_code: null }),
          })
          .eq('id', shuffleId)
      } catch (rollbackError) {
        console.error('Failed to rollback shared status:', rollbackError)
      }

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

    // If we got here, the transaction was successful
    transactionSuccess = true

    return NextResponse.json({
      success: true,
      shareCode,
      shuffle: updatedShuffle,
    })
  } catch (error) {
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
