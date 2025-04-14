'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import supabase from '@/lib/supabase'
import { Navbar } from './ui/navbar'
import { GlobalShuffleCounter } from './global-shuffle-counter'

interface UserStats {
  userShuffleCount: number
  userStreak: number
  isLoading: boolean
}

const UserStatsContext = createContext<UserStats>({
  userShuffleCount: 0,
  userStreak: 0,
  isLoading: true,
})

export const useUserStats = () => useContext(UserStatsContext)

// Create a function at module scope to refresh user stats
let refreshUserStatsFunction: (() => void) | null = null

export function refreshUserStats() {
  if (refreshUserStatsFunction) {
    refreshUserStatsFunction()
  }
}

export function UserStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<UserStats>({
    userShuffleCount: 0,
    userStreak: 0,
    isLoading: true,
  })
  const { user } = useAuth()

  // Function to fetch user stats - wrapped in useCallback
  const fetchUserStats = useCallback(async () => {
    if (!user) {
      setStats({
        userShuffleCount: 0,
        userStreak: 0,
        isLoading: false,
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('total_shuffles, shuffle_streak, last_shuffle_date')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user stats:', error)
        setStats({
          userShuffleCount: 0,
          userStreak: 0,
          isLoading: false,
        })
        return
      }

      console.log('User stats fetched from DB:', data)
      setStats({
        userShuffleCount: data?.total_shuffles || 0,
        userStreak: data?.shuffle_streak || 0,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error in fetch user stats:', error)
      setStats({
        userShuffleCount: 0,
        userStreak: 0,
        isLoading: false,
      })
    }
  }, [user])

  // Register the refresh function
  useEffect(() => {
    refreshUserStatsFunction = fetchUserStats
    return () => {
      refreshUserStatsFunction = null
    }
  }, [fetchUserStats])

  useEffect(() => {
    // Listen for stats update events
    const handleStatsUpdate = (event: CustomEvent) => {
      console.log('UserStatsProvider received stats update event:', event.detail)
      if (event.detail?.userStats) {
        const { userStats } = event.detail
        setStats((prevStats) => ({
          ...prevStats,
          userShuffleCount: userStats.total_shuffles || 0,
          userStreak: userStats.shuffle_streak || 0,
          isLoading: false,
        }))
      }
    }

    // Add event listener
    window.addEventListener('statsUpdate', handleStatsUpdate as EventListener)

    // Initial fetch
    fetchUserStats()

    // Clean up on unmount
    return () => {
      window.removeEventListener('statsUpdate', handleStatsUpdate as EventListener)
    }
  }, [user, fetchUserStats])

  return (
    <UserStatsContext.Provider value={stats}>
      {children}
      <div className='border-t border-border px-4 py-1 text-sm bg-card'>
        <GlobalShuffleCounter
          userShuffleCount={stats.userShuffleCount}
          userStreak={stats.userStreak}
        />
      </div>
    </UserStatsContext.Provider>
  )
}
