'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useLocalProfile } from '@/contexts/LocalProfileContext'
import { UserStats } from '@/types'
import { GlobalShuffleCounter } from './global-shuffle-counter'

interface UserStatsContextType {
  userStats: UserStats | null
  isLoading: boolean
  refreshUserStats: () => void
}

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined)

export function UserStatsProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useLocalProfile()
  const userStats: UserStats = {
    total_shuffles: profile.total_shuffles,
    shuffle_streak: profile.shuffle_streak,
    last_shuffle_date: profile.last_shuffle_date,
  }

  const value = {
    userStats,
    isLoading,
    refreshUserStats: () => undefined,
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
  // Stats are local-first and update through LocalProfileProvider state.
}
