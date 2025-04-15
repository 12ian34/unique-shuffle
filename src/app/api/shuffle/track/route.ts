import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkAchievements } from '@/lib/achievements'
import supabaseAdmin from '@/lib/supabase-admin'
import { Achievement } from '@/types'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'
import { generateRandomString } from '@/lib/utils'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createAuthError,
  createDatabaseError,
  createValidationError,
} from '@/lib/errors'

// Track a new shuffle
export async function POST(request: Request) {
  // Set CORS headers for credential-included requests
  const origin = request.headers.get('origin') || ''
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers, status: 204 })
  }

  try {
    const { cards } = await request.json()

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      const error = createValidationError('Invalid or empty cards data', {
        providedLength: cards?.length || 0,
      })
      return NextResponse.json({ error }, { status: 400, headers })
    }

    // Check for Authorization header first
    const authHeader = request.headers.get('Authorization')
    let user: User | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Remove "Bearer " prefix

      // Initialize a Supabase client to verify the token
      const supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false, // Don't persist the session
            autoRefreshToken: false,
          },
        }
      )

      // Verify the token
      const { data: userData, error: verifyError } = await supabaseClient.auth.getUser(token)

      if (verifyError) {
        console.error('❌ Error verifying token:', verifyError)

        // Fall back to cookie-based auth
        const supabase = await createClient()
        const { data: cookieUser, error: cookieError } = await supabase.auth.getUser()

        if (cookieError) {
          console.error('❌ Cookie auth also failed:', cookieError)
          const error = createAuthError('Authentication failed', {
            details: 'Invalid token and cookie auth failed',
            tokenError: verifyError.message,
            cookieError: cookieError.message,
          })
          return NextResponse.json({ error }, { status: 401, headers })
        }

        if (!cookieUser.user) {
          return NextResponse.json({ success: true, saved: false }, { headers })
        }

        user = cookieUser.user
      } else {
        user = userData.user
      }
    } else {
      // No Authorization header, try cookie-based auth
      const supabase = await createClient()
      const { data: cookieUser, error: cookieError } = await supabase.auth.getUser()

      if (cookieError) {
        const error = createAuthError('Cookie authentication failed', {
          cookieError: cookieError.message,
        })
        return NextResponse.json({ error }, { status: 401, headers })
      }

      if (!cookieUser.user) {
        return NextResponse.json({ success: true, saved: false }, { headers })
      }

      user = cookieUser.user
    }

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          saved: false,
          message: 'Anonymous shuffle - not saved to profile',
        },
        { headers }
      )
    }

    // Use admin client for the rest of the operations to avoid RLS issues
    const supabaseAdmin = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Check if there's an existing row in the users table
    const { data: existingUser, error: userQueryError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userQueryError && userQueryError.code !== 'PGRST116') {
      const error = createDatabaseError('Error fetching user data from database', {
        originalError: userQueryError,
        userId: user.id,
      })
      return NextResponse.json({ error }, { status: 500, headers })
    }

    // Get current user shuffle count
    const shuffleCount = existingUser ? existingUser.total_shuffles + 1 : 1

    // Save the shuffle
    const { data: shuffle, error: shuffleError } = await supabaseAdmin
      .from('shuffles')
      .insert({
        user_id: user.id,
        cards,
        is_shared: true, // Mark as shared so it can be viewed by ID
        share_code: generateRandomString(10), // Generate a share code for easy sharing
      })
      .select()
      .single()

    if (shuffleError) {
      const error = createDatabaseError('Failed to save shuffle to database', {
        originalError: shuffleError,
        userId: user.id,
      })
      return NextResponse.json({ error }, { status: 500, headers })
    }

    // Check for achievements
    let achievements: Achievement[] = []
    if (cards) {
      achievements = checkAchievements(cards, shuffleCount)

      // Save earned achievements
      if (achievements.length > 0 && user) {
        for (const achievement of achievements) {
          // Check if user already has this achievement on this specific shuffle
          const { data: existingAchievement, error: fetchError } = await supabaseAdmin
            .from('achievements')
            .select('*')
            .eq('user_id', user.id)
            .eq('achievement_id', achievement.id)
            .eq('shuffle_id', shuffle.id)
            .maybeSingle()

          if (fetchError) {
            console.error('Error checking existing achievement:', fetchError)
            continue
          }

          // Only insert if this exact achievement hasn't been recorded for this shuffle
          if (!existingAchievement) {
            // Insert new achievement
            const { error: insertError } = await supabaseAdmin.from('achievements').insert({
              user_id: user.id,
              achievement_id: achievement.id,
              shuffle_id: shuffle.id,
              // count field is now automatically set to 1 by database default
            })

            if (insertError) {
              console.error('Error saving new achievement:', insertError)
            }
          }
        }
      }
    }

    // Update user stats
    if (existingUser) {
      // Calculate streak - we rely on the database trigger to update it correctly
      // Just making sure we're not overriding it here

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          total_shuffles: shuffleCount,
          last_shuffle_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
          updated_at: new Date().toISOString(),
          // Don't set shuffle_streak here as it's handled by the database trigger
        })
        .eq('id', user.id)

      if (updateError) {
        const error = createDatabaseError('Failed to update user stats', {
          originalError: updateError,
          userId: user.id,
        })
        return NextResponse.json(
          {
            error,
            shuffle,
            shuffleCount,
          },
          { status: 500, headers }
        )
      }

      // Get the updated user data to return the current streak
      const { data: updatedUser, error: fetchUpdatedUserError } = await supabaseAdmin
        .from('users')
        .select('total_shuffles, shuffle_streak, last_shuffle_date')
        .eq('id', user.id)
        .single()

      if (fetchUpdatedUserError) {
        console.error('Error fetching updated user data:', fetchUpdatedUserError)
      }

      // Return updated user stats in the response
      return NextResponse.json(
        {
          success: true,
          saved: true,
          shuffle,
          shuffleCount,
          achievements,
          userStats: updatedUser || {
            total_shuffles: shuffleCount,
            // If we couldn't fetch updated user, return at least the count
          },
        },
        { headers }
      )
    } else {
      const error = createError(
        'User profile not found',
        ErrorType.DATABASE,
        ErrorSeverity.ERROR,
        { userId: user.id },
        'USER_NOT_FOUND'
      )
      return NextResponse.json({ error }, { status: 404, headers })
    }
  } catch (error) {
    const appError = createError(
      'Failed to track shuffle',
      ErrorType.SHUFFLE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'SHUFFLE_TRACK_ERROR'
    )
    return NextResponse.json({ error: appError }, { status: 500, headers })
  }
}
