export interface CurrentUser {
  id: string
  email?: string | null
  name?: string | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return null
}
