import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import {
  ErrorType,
  ErrorSeverity,
  createError,
  createAuthError,
  createValidationError,
} from '@/lib/errors'

// Helper function to get authenticated user
async function getAuthenticatedUser(request: Request) {
  try {
    const supabase = await createClient()

    // First try to get user from server-side auth
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Server-side auth error:', error.message)
    }

    if (data?.user) {
      return data.user
    }

    // If server-side auth fails, try to get from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return null
    }

    if (!authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)

    // Create a browser client to validate the token
    const browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      // Set the session manually
      const { data, error } = await browserClient.auth.getUser(token)
      if (error) {
        console.error('Token validation error:', error.message)
        return null
      }

      if (!data.user) {
        return null
      }

      return data.user
    } catch (error) {
      console.error('Exception in token authentication:', error)
      return null
    }
  } catch (error) {
    console.error('Exception in getAuthenticatedUser:', error)
    return null
  }
}

// Get all friends or friend requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'accepted'

    // Get the current user
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    // Get the supabase client
    const supabase = await createClient()

    // Query without using relationship joins - first as requester
    const { data: asRequester, error: requesterError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)

    if (requesterError) {
      console.error('Error querying as requester:', requesterError)
      return NextResponse.json(
        {
          error: createError(
            'Database query failed: ' + requesterError.message,
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            {
              context: 'querying as requester',
              originalError: requesterError,
            },
            'FRIENDS_QUERY_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    // Then check where user is the recipient
    const { data: asRecipient, error: recipientError } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', status)

    if (recipientError) {
      console.error('Error querying as recipient:', recipientError)
      return NextResponse.json(
        {
          error: createError(
            'Database query failed: ' + recipientError.message,
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            {
              context: 'querying as recipient',
              originalError: recipientError,
            },
            'FRIENDS_QUERY_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    // Combine the results
    const friendships = [...(asRequester || []), ...(asRecipient || [])]

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get all user IDs we need to look up
    const userIdsToLookup = new Set<string>()

    friendships.forEach((friendship) => {
      // For each friendship, we need to look up the other user
      // If user is the requester, we need the friend_id; otherwise, we need the user_id
      const otherUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
      userIdsToLookup.add(otherUserId)
    })

    // Fetch user details for all IDs at once
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', Array.from(userIdsToLookup))

    if (userError) {
      console.error('Error fetching user details:', userError)
      return NextResponse.json(
        {
          error: createError(
            'Failed to fetch user details: ' + userError.message,
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { originalError: userError },
            'USER_DETAILS_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    // Create a map of user ID to user details for quick lookup
    const userMap = new Map()
    userDetails?.forEach((user) => {
      userMap.set(user.id, user)
    })

    // Format the response with error handling for each record
    const formattedFriends = []

    for (const friendship of friendships) {
      try {
        const isRequester = friendship.user_id === user.id
        const otherUserId = isRequester ? friendship.friend_id : friendship.user_id
        const otherUser = userMap.get(otherUserId)

        if (!otherUser) {
          console.error('Could not find user details for ID:', otherUserId)
          continue
        }

        formattedFriends.push({
          id: friendship.id,
          userId: otherUser.id,
          username: otherUser.username,
          status: friendship.status,
          isRequester,
          createdAt: friendship.created_at,
        })
      } catch (err) {
        console.error('Error processing friendship:', err, friendship)
        // Skip this record but continue with others
      }
    }

    return NextResponse.json({ data: formattedFriends })
  } catch (error) {
    console.error('Error fetching friends:', error)
    const appError = createError(
      'Failed to fetch friends',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'FRIENDS_FETCH_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}

// Send a friend request
export async function POST(request: Request) {
  try {
    const { friendId } = await request.json()

    // Get the current user
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    // Get the supabase client
    const supabase = await createClient()

    if (!friendId) {
      return NextResponse.json(
        {
          error: createValidationError('Missing friendId parameter', { param: 'friendId' }),
        },
        { status: 400 }
      )
    }

    if (friendId === user.id) {
      return NextResponse.json(
        {
          error: createValidationError('Cannot send a friend request to yourself', {
            userId: user.id,
          }),
        },
        { status: 400 }
      )
    }

    // Check if friend exists
    const { data: friendUser, error: friendError } = await supabase
      .from('users')
      .select('id')
      .eq('id', friendId)
      .single()

    if (friendError || !friendUser) {
      return NextResponse.json(
        {
          error: createError(
            'User not found',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            {
              friendId,
              originalError: friendError,
            },
            'USER_NOT_FOUND'
          ),
        },
        { status: 404 }
      )
    }

    // Check if a friendship already exists
    const { data: existingFriendship, error: existingError } = await supabase
      .from('friends')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
      )
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        {
          error: createError(
            'Failed to check existing friendship',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { originalError: existingError },
            'DATABASE_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    if (existingFriendship) {
      return NextResponse.json(
        {
          error: createValidationError('Friendship already exists', {
            status: existingFriendship.status,
            friendshipId: existingFriendship.id,
          }),
        },
        { status: 400 }
      )
    }

    // Create a new friendship
    const { data: friendship, error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: createError(
            'Failed to create friendship record',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { originalError: error },
            'DATABASE_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      friendship,
    })
  } catch (error) {
    console.error('Error creating friend request:', error)
    const appError = createError(
      'Failed to create friend request',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'FRIEND_REQUEST_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}

// Update a friend request (accept/reject)
export async function PUT(request: Request) {
  try {
    const { friendshipId, status } = await request.json()

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        {
          error: createValidationError('Invalid status parameter', {
            providedStatus: status,
            allowedValues: ['accepted', 'rejected'],
          }),
        },
        { status: 400 }
      )
    }

    // Get the current user
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    // Get the supabase client
    const supabase = await createClient()

    // Get the friendship to verify the user is the recipient
    const { data: friendship, error: fetchError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', friendshipId)
      .single()

    if (fetchError || !friendship) {
      return NextResponse.json(
        {
          error: createError(
            'Friendship not found',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            {
              friendshipId,
              originalError: fetchError,
            },
            'RESOURCE_NOT_FOUND'
          ),
        },
        { status: 404 }
      )
    }

    // Only the recipient can accept/reject the request
    if (friendship.friend_id !== user.id) {
      return NextResponse.json(
        {
          error: createAuthError('You can only respond to friend requests sent to you', {
            friendshipId,
            requesterId: friendship.user_id,
            userId: user.id,
          }),
        },
        { status: 403 }
      )
    }

    // Update the friendship status
    const { data: updatedFriendship, error } = await supabase
      .from('friends')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: createError(
            'Failed to update friendship status',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            { originalError: error },
            'DATABASE_ERROR'
          ),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      friendship: updatedFriendship,
    })
  } catch (error) {
    console.error('Error updating friend request:', error)
    const appError = createError(
      'Failed to update friend request',
      ErrorType.DATABASE,
      ErrorSeverity.ERROR,
      { originalError: error instanceof Error ? error.message : String(error) },
      'FRIEND_REQUEST_UPDATE_ERROR'
    )

    return NextResponse.json({ error: appError }, { status: 500 })
  }
}
