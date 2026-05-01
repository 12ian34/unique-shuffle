'use client'

export const authClient = {
  signIn: {
    email: async () => ({ error: new Error('Authentication has been removed.') }),
  },
  signUp: {
    email: async () => ({ error: new Error('Authentication has been removed.') }),
  },
  signOut: async () => undefined,
}

export function useSession() {
  return { data: null, isPending: false }
}
