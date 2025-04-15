'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserStats } from '@/types'
import { GlobalShuffleCounter } from './global-shuffle-counter'
import { STATS_REFRESH_INTERVAL } from '@/lib/constants'

interface UserStatsContextType {
  userStats: UserStats | null
  isLoading: boolean
  refreshUserStats: () => void
}

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined)

// Create a refresh function at module scope
let refreshFunction: (() => void) | null = null

export function UserStatsProvider({ children }: { children: ReactNode }) {
  const { session, supabase } = useAuth()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserStats = useCallback(async () => {
    if (!session?.user) {
      setUserStats(null)
      setIsLoading(false)
      return // Exit if user is not logged in
    }

    setIsLoading(true) // Set loading true before fetch
    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_shuffles, shuffle_streak, last_shuffle_date')
        .eq('id', session.user.id)
        .single<UserStats>() // Use the UserStats type here

      if (error) {
        console.error('[UserStatsProvider] Error fetching user stats:', error)
        setUserStats(null)
      } else {
        setUserStats(data)
      }
    } catch (err) {
      // Catch potential errors during the async operation itself
      console.error('[UserStatsProvider] Exception during fetchUserStats:', err)
      setUserStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [session, supabase]) // Add supabase to dependencies

  // Register the refresh function at the module level
  useEffect(() => {
    refreshFunction = fetchUserStats
    return () => {
      refreshFunction = null // Clean up on unmount
    }
  }, [fetchUserStats])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchUserStats() // Initial fetch

    // Refresh stats periodically
    const intervalId = setInterval(fetchUserStats, STATS_REFRESH_INTERVAL)

    // Cleanup interval on unmount or when fetchUserStats changes
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchUserStats]) // Run whenever fetchUserStats changes (which depends on session/supabase)

  // Effect for handling manual trigger events (e.g., after shuffle)
  useEffect(() => {
    const handleStatsUpdate = (event: CustomEvent) => {
      if (event.detail?.userStats) {
        setUserStats(event.detail.userStats)
      }
    }
    window.addEventListener('statsUpdate', handleStatsUpdate as EventListener)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('statsUpdate', handleStatsUpdate as EventListener)
    }
  }, []) // Empty dependency array: runs only once on mount

  const value = {
    userStats,
    isLoading,
    refreshUserStats: fetchUserStats, // Expose the fetch function
  }

  return (
    <UserStatsContext.Provider value={value}>
      {children}
      <div className='border-t border-border px-4 py-1 text-sm bg-card'>
        <GlobalShuffleCounter
          userShuffleCount={userStats?.total_shuffles || 0}
          userStreak={userStats?.shuffle_streak || 0}
        />
      </div>
    </UserStatsContext.Provider>
  )
}

// Hook to use the context
export function useUserStats() {
  const context = useContext(UserStatsContext)
  if (context === undefined) {
    throw new Error('useUserStats must be used within a UserStatsProvider')
  }
  return context
}

// Global function to trigger refresh
export function refreshUserStats() {
  if (refreshFunction) {
    refreshFunction()
  }
}
