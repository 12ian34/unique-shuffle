import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { achievements } from '@/lib/db/schema'
import { toDbAchievement } from '@/lib/db/mappers'
import { getCurrentUser } from '@/lib/auth/session'
import { createAuthError } from '@/lib/errors'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: createAuthError('Authentication required') }, { status: 401 })
  }

  const userAchievements = await db
    .select()
    .from(achievements)
    .where(eq(achievements.userId, user.id))
    .orderBy(desc(achievements.achievedAt))

  return NextResponse.json({ data: userAchievements.map(toDbAchievement) })
}
