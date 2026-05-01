'use client'

import React, { createContext, useContext, useMemo } from 'react'

interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
}

interface AuthSession {
  user: AuthUser
  session?: unknown
}

type AuthContextType = {
  session: AuthSession | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null
  }>
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{
    error: Error | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      session: null,
      isLoading: false,
      signIn: async () => ({
        error: new Error('Authentication has been removed. Use the local profile instead.'),
      }),
      signUp: async () => ({
        error: new Error('Authentication has been removed. Use the local profile instead.'),
      }),
      signOut: async () => undefined,
    }),
    []
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
