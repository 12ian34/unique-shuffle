'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { UserStats } from '@/types'
import {
  getUserStats,
  subscribeToStats,
  fetchStats,
  initializeStats,
  getGlobalCount,
} from '@/lib/stats-store'

interface GlobalShuffleCounterProps {
  variant?: 'navbar' | 'card'
  userStats?: UserStats
  onUserStatsUpdated?: (stats: UserStats) => void
}

export function GlobalShuffleCounter({
  variant = 'card',
  userStats,
  onUserStatsUpdated,
}: GlobalShuffleCounterProps) {
  // Use state only for UI rendering
  const [totalShuffles, setTotalShuffles] = useState<number>(0)
  const [userShuffles, setUserShuffles] = useState<UserStats | undefined>(userStats)
  const [isLoading, setIsLoading] = useState<{ global: boolean; user: boolean }>({
    global: true,
    user: !!userStats,
  })
  const [isHighlighted, setIsHighlighted] = useState<{ global: boolean; user: boolean }>({
    global: false,
    user: false,
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Function to briefly show a highlight effect for either counter
  const highlightUpdate = useCallback((counter: 'global' | 'user') => {
    setIsHighlighted((prev) => ({ ...prev, [counter]: true }))
    setTimeout(() => {
      setIsHighlighted((prev) => ({ ...prev, [counter]: false }))
    }, 1000)
  }, [])

  // Initialize the store on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize stats store
        await initializeStats()

        // Get initial counts from store - get global count separately from user stats
        const globalCount = getGlobalCount()
        const userStats = getUserStats()

        setTotalShuffles(globalCount)
        if (userStats) {
          setUserShuffles(userStats)
        }

        // Set initialized flag
        setIsInitialized(true)
        setIsLoading({ global: false, user: false })
      } catch (error) {
        console.error('Failed to initialize GlobalShuffleCounter:', error)
        setIsLoading({ global: false, user: false })
      }
    }

    initialize()
  }, [])

  // Update our counts from the store
  const updateFromStore = useCallback(() => {
    // Get latest counts from store - use separate functions for global and user stats
    const globalCount = getGlobalCount()
    const stats = getUserStats()

    // Update global count if different
    if (globalCount !== totalShuffles) {
      setTotalShuffles(globalCount)
      highlightUpdate('global')
    }

    // Update user stats if different
    if (
      stats &&
      (!userShuffles ||
        stats.total_shuffles !== userShuffles.total_shuffles ||
        stats.shuffle_streak !== userShuffles.shuffle_streak)
    ) {
      setUserShuffles(stats)
      highlightUpdate('user')

      // Call callback if provided
      if (onUserStatsUpdated) {
        onUserStatsUpdated(stats)
      }
    }
  }, [totalShuffles, userShuffles, highlightUpdate, onUserStatsUpdated])

  // Subscribe to store updates
  useEffect(() => {
    if (!isInitialized) return

    // Update from store on mount
    updateFromStore()

    // Subscribe to future updates
    const unsubscribe = subscribeToStats(updateFromStore)

    // Unsubscribe on unmount
    return unsubscribe
  }, [updateFromStore, isInitialized])

  // Handle when userStats prop changes (from parent)
  useEffect(() => {
    if (userStats) {
      setUserShuffles(userStats)
    }
  }, [userStats])

  // For click-to-refresh functionality
  const handleManualRefresh = async () => {
    setIsLoading({ global: true, user: true })
    try {
      // Force a refresh of all stats
      await fetchStats(true)

      // After fetching, ensure our component is using the right values
      const globalShuffles = getGlobalCount()
      const userStatsFromStore = getUserStats()

      // Update our component state with the fresh values
      setTotalShuffles(globalShuffles)
      if (userStatsFromStore) {
        setUserShuffles(userStatsFromStore)
      }
    } finally {
      setIsLoading({ global: false, user: false })
    }
  }

  if (variant === 'navbar') {
    return (
      <div className='flex items-center'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5'>
            <span className='text-gray-400 text-xs font-medium'>global shuffles:</span>
            <span
              className={cn(
                'font-bold text-sm transition-colors duration-300',
                isHighlighted.global ? 'text-green-400' : 'text-indigo-400'
              )}
              onClick={handleManualRefresh}
              style={{ cursor: 'pointer' }}
              title='Click to refresh counts'
            >
              {isLoading.global ? '...' : totalShuffles.toLocaleString()}
            </span>
          </div>

          {userShuffles && (
            <>
              <div className='flex items-center gap-1.5'>
                <span className='text-gray-400 text-xs font-medium'>your shuffles:</span>
                <span
                  className={cn(
                    'font-bold text-sm transition-colors duration-300',
                    isHighlighted.user ? 'text-green-400' : 'text-indigo-400'
                  )}
                  onClick={handleManualRefresh}
                  style={{ cursor: 'pointer' }}
                  title='Click to refresh counts'
                >
                  {isLoading.user ? '...' : userShuffles.total_shuffles.toLocaleString()}
                </span>
              </div>

              <div className='flex items-center gap-1.5'>
                <span className='text-gray-400 text-xs font-medium'>streak:</span>
                <span className='font-bold text-sm text-indigo-400'>
                  {userShuffles.shuffle_streak.toLocaleString()}{' '}
                  {userShuffles.shuffle_streak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='bg-slate-800/70 rounded-lg p-4 shadow-md space-y-4'>
      <h3 className='text-lg font-semibold text-slate-200 mb-2'>Shuffle Statistics</h3>

      {/* Global stats */}
      <div className='flex items-center justify-between'>
        <span className='text-slate-400'>global shuffles:</span>
        <span
          className={`text-2xl font-bold transition-colors duration-300 ${
            isHighlighted.global ? 'text-green-400' : 'text-indigo-400'
          }`}
          onClick={handleManualRefresh}
          style={{ cursor: 'pointer' }}
          title='Click to refresh counts'
        >
          {isLoading.global ? '...' : totalShuffles.toLocaleString()}
        </span>
      </div>

      {/* User stats */}
      {userShuffles && (
        <div className='pt-4 border-t border-slate-700/50 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-slate-400'>Your shuffles:</span>
            <span
              className={`text-2xl font-bold transition-colors duration-300 ${
                isHighlighted.user ? 'text-green-400' : 'text-indigo-400'
              }`}
              onClick={handleManualRefresh}
              style={{ cursor: 'pointer' }}
              title='Click to refresh counts'
            >
              {isLoading.user ? '...' : userShuffles.total_shuffles.toLocaleString()}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-slate-400'>Your streak:</span>
            <span className='text-2xl font-bold text-indigo-400'>
              {userShuffles.shuffle_streak.toLocaleString()}{' '}
              {userShuffles.shuffle_streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
