import { UserProfileRow } from '@/lib/db/schema'

interface AuthUser {
  id: string
}

export async function ensureUserProfile(user: AuthUser): Promise<UserProfileRow> {
  throw new Error(`Server profiles were removed. Use local profile ${user.id} in the browser.`)
}
