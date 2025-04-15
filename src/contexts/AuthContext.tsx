'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { User, Session, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js'
import { useAuthTracking } from '@/hooks/use-auth-tracking'
import { trackEvent } from '@/lib/analytics'
import { Database } from '@/types/supabase'

type AuthContextType = {
  session: Session | null
  supabase: SupabaseClient<Database, 'public'>
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
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const user = useMemo(() => session?.user ?? null, [session])

  useAuthTracking(
    !!user,
    user?.id,
    user
      ? {
          email: user.email,
          username: user.user_metadata?.username,
        }
      : undefined
  )

  useEffect(() => {
    setIsLoading(true)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession)
        setIsLoading(false)

        if (event === 'SIGNED_IN') {
          trackEvent('user_signed_in', {
            method: 'email',
            userId: currentSession?.user?.id,
          })
        } else if (event === 'SIGNED_OUT') {
          trackEvent('user_signed_out')
        } else if (event === 'INITIAL_SESSION') {
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          // Session updated silently
        } else if (event === 'USER_UPDATED') {
          trackEvent('user_updated', {
            userId: currentSession?.user?.id,
          })
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

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
    [supabase, router]
  )

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

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
    [supabase]
  )

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [supabase, router])

  const value = useMemo(
    () => ({
      session,
      supabase,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, supabase, isLoading, signIn, signUp, signOut]
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
