'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth/client'
import { useAuthTracking } from '@/hooks/use-auth-tracking'
import { trackEvent } from '@/lib/analytics'

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
  const { data, isPending } = useSession()
  const router = useRouter()

  const session = useMemo<AuthSession | null>(() => {
    if (!data?.user) return null
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      },
      session: data.session,
    }
  }, [data])

  const user = useMemo(() => session?.user ?? null, [session])

  useAuthTracking(
    !!user,
    user?.id,
    user
      ? {
          email: user.email,
          username: user.name,
        }
      : undefined
  )

  useEffect(() => {
    if (session?.user) {
      trackEvent('user_signed_in', {
        method: 'email',
        userId: session.user.id,
      })
    }
  }, [session?.user])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await authClient.signIn.email({
          email,
          password,
        })
        const error = 'error' in result ? result.error : null

        if (error) throw error

        router.refresh()

        return { error: null }
      } catch (error: any) {
        console.error('Error signing in:', error)
        trackEvent('signin_error', {
          error: error.message,
          email: email,
        })
        return { error }
      }
    },
    [router]
  )

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        const result = await authClient.signUp.email({
          email,
          password,
          name: username,
        })
        const error = 'error' in result ? result.error : null

        if (error) throw error

        trackEvent('user_signed_up', {
          username,
        })

        return { error: null }
      } catch (error: any) {
        console.error('Error signing up:', error)
        trackEvent('signup_error', {
          error: error.message,
          email: email,
        })
        return { error }
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut()
      trackEvent('user_signed_out')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [router])

  const value = useMemo(
    () => ({
      session,
      isLoading: isPending,
      signIn,
      signUp,
      signOut,
    }),
    [session, isPending, signIn, signUp, signOut]
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
