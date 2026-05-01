import { NextResponse } from 'next/server'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { achievements, shuffles, userProfiles } from '@/lib/db/schema'
import { toDbUser } from '@/lib/db/mappers'
import { ensureUserProfile } from '@/lib/auth/profile'
import { getCurrentUser } from '@/lib/auth/session'
import { MAX_USERNAME_LENGTH } from '@/lib/constants'
import { createAuthError, createValidationError } from '@/lib/errors'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: createAuthError('Authentication required') }, { status: 401 })
  }

  const profile = await ensureUserProfile(user)

  const [{ count: achievementCount }] = await db
    .select({ count: sql<number>`count(distinct ${achievements.achievementId})` })
    .from(achievements)
    .where(eq(achievements.userId, user.id))

  const [{ count: savedShuffleCount }] = await db
    .select({ count: count() })
    .from(shuffles)
    .where(and(eq(shuffles.userId, user.id), eq(shuffles.isSaved, true)))

  return NextResponse.json({
    profile: {
      ...toDbUser(profile),
      achievementCount: Number(achievementCount || 0),
      savedShuffleCount: Number(savedShuffleCount || 0),
    },
  })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: createAuthError('Authentication required') }, { status: 401 })
  }

  const { username } = await request.json()
  const trimmedUsername = typeof username === 'string' ? username.trim() : ''

  if (!trimmedUsername || trimmedUsername.length > MAX_USERNAME_LENGTH) {
    return NextResponse.json(
      {
        error: createValidationError('Invalid username', {
          maxLength: MAX_USERNAME_LENGTH,
        }),
      },
      { status: 400 }
    )
  }

  const [updatedProfile] = await db
    .update(userProfiles)
    .set({
      username: trimmedUsername,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userProfiles.id, user.id))
    .returning()

  return NextResponse.json({ profile: toDbUser(updatedProfile) })
}

export async function DELETE() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: createAuthError('Authentication required') }, { status: 401 })
  }

  const savedShuffles = await db
    .select()
    .from(shuffles)
    .where(and(eq(shuffles.userId, user.id), eq(shuffles.isSaved, true)))
    .orderBy(desc(shuffles.createdAt))

  return NextResponse.json({ data: savedShuffles })
}
