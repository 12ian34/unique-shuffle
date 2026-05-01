import { NextResponse } from 'next/server'
import { and, eq, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { friends, userProfiles } from '@/lib/db/schema'
import { ensureUserProfile } from '@/lib/auth/profile'
import { getCurrentUser } from '@/lib/auth/session'
import { ErrorType, ErrorSeverity, createError, createAuthError, createValidationError } from '@/lib/errors'

interface FriendshipListRow {
  id: string
  userId: string
  friendId: string
  status: string
  requesterUsername: string
  recipientUsername: string
  createdAt: string
}

function formatFriendship(row: FriendshipListRow, currentUserId: string) {
  const isRequester = row.userId === currentUserId

  return {
    id: row.id,
    userId: isRequester ? row.friendId : row.userId,
    username: isRequester ? row.recipientUsername : row.requesterUsername,
    status: row.status,
    isRequester,
    createdAt: row.createdAt,
  }
}

// Get all friends or friend requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'accepted'

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    await ensureUserProfile(user)
    const requester = userProfiles
    const recipient = userProfiles
    const rows = await db
      .select({
        id: friends.id,
        userId: friends.userId,
        friendId: friends.friendId,
        status: friends.status,
        requesterUsername: requester.username,
        recipientUsername: recipient.username,
        createdAt: friends.createdAt,
      })
      .from(friends)
      .innerJoin(requester, eq(friends.userId, requester.id))
      .innerJoin(recipient, eq(friends.friendId, recipient.id))
      .where(
        and(
          eq(friends.status, status),
          or(eq(friends.userId, user.id), eq(friends.friendId, user.id))
        )
      )

    return NextResponse.json({ data: rows.map((row) => formatFriendship(row, user.id)) })
  } catch (error) {
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
    const { username } = await request.json()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    if (!username) {
      return NextResponse.json(
        {
          error: createValidationError('Missing username parameter', { param: 'username' }),
        },
        { status: 400 }
      )
    }

    await ensureUserProfile(user)
    const [friendUser] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.username, username))
      .limit(1)

    if (!friendUser) {
      return NextResponse.json(
        {
          error: createValidationError('User not found', { username }),
        },
        { status: 404 }
      )
    }

    if (friendUser.id === user.id) {
      return NextResponse.json(
        {
          error: createValidationError('Cannot send a friend request to yourself', {
            userId: user.id,
          }),
        },
        { status: 400 }
      )
    }

    // Check if a friendship already exists
    const [existingFriendship] = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, user.id), eq(friends.friendId, friendUser.id)),
          and(eq(friends.userId, friendUser.id), eq(friends.friendId, user.id))
        )
      )
      .limit(1)

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
    const [friendship] = await db
      .insert(friends)
      .values({
        userId: user.id,
        friendId: friendUser.id,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({
      success: true,
      friendship,
    })
  } catch (error) {
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

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: createAuthError('Authentication required') },
        { status: 401 }
      )
    }

    // Get the friendship to verify the user is the recipient
    const [friendship] = await db
      .select()
      .from(friends)
      .where(eq(friends.id, friendshipId))
      .limit(1)

    if (!friendship) {
      return NextResponse.json(
        {
          error: createError(
            'Friendship not found',
            ErrorType.DATABASE,
            ErrorSeverity.ERROR,
            {
              friendshipId,
            },
            'RESOURCE_NOT_FOUND'
          ),
        },
        { status: 404 }
      )
    }

    // Only the recipient can accept/reject the request
    if (friendship.friendId !== user.id) {
      return NextResponse.json(
        {
          error: createAuthError('You can only respond to friend requests sent to you', {
            friendshipId,
            requesterId: friendship.userId,
            userId: user.id,
          }),
        },
        { status: 403 }
      )
    }

    // Update the friendship status
    const [updatedFriendship] = await db
      .update(friends)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(friends.id, friendshipId))
      .returning()

    return NextResponse.json({
      success: true,
      friendship: updatedFriendship,
    })
  } catch (error) {
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
