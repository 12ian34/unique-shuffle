'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { useAuthTracking } from '@/hooks/use-auth-tracking'
import { trackEvent } from '@/lib/analytics'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null } | null
  }>
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null } | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Track user auth state in PostHog
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
    // Check active session
    const getSession = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession()
        setSession(activeSession)
        setUser(activeSession?.user || null)
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user || null)

      if (event === 'SIGNED_IN') {
        // Track sign in event
        trackEvent('user_signed_in', {
          method: 'email',
          userId: currentSession?.user?.id,
        })
      } else if (event === 'SIGNED_OUT') {
        // Track sign out event
        trackEvent('user_signed_out')
      } else if (event === 'USER_UPDATED') {
        // Track user update event
        trackEvent('user_updated', {
          userId: currentSession?.user?.id,
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      console.error('Error signing in:', error)
      // Track failed sign in attempt
      trackEvent('signin_error', {
        error: error.message,
        email: email, // Safe to track for errors
      })
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      })

      if (error) throw error

      // Track successful signup
      trackEvent('user_signed_up', {
        username,
      })

      return { data, error: null }
    } catch (error: any) {
      console.error('Error signing up:', error)
      // Track failed signup attempt
      trackEvent('signup_error', {
        error: error.message,
        email: email, // Safe to track for errors
      })
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
