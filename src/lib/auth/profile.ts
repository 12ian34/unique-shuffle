import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { userProfiles, UserProfileRow } from '@/lib/db/schema'
import { generateUsername } from '@/utils/username-generator'

interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
}

function usernameFromUser(user: AuthUser) {
  const fromName = user.name ? normalizeUsername(user.name) : ''
  if (fromName) return fromName

  const emailPrefix = user.email?.split('@')[0]
  const fromEmail = emailPrefix ? normalizeUsername(emailPrefix) : ''
  return fromEmail || generateUsername()
}

export async function ensureUserProfile(user: AuthUser): Promise<UserProfileRow> {
  const [existingProfile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1)

  if (existingProfile) {
    return existingProfile
  }

  const baseUsername = usernameFromUser(user)
  const email = user.email || `${user.id}@neon-auth.local`

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = attempt === 0 ? baseUsername : `${baseUsername}-${attempt + 1}`

    try {
      const [profile] = await db
        .insert(userProfiles)
        .values({
          id: user.id,
          username,
          email,
        })
        .returning()

      return profile
    } catch (error) {
      if (attempt === 4) {
        throw error
      }
    }
  }

  throw new Error('Failed to create user profile')
}
