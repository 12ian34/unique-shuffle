import { auth } from './server'

export interface CurrentUser {
  id: string
  email?: string | null
  name?: string | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data: session } = await auth.getSession()
  const user = session?.user

  if (!user?.id) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
}
