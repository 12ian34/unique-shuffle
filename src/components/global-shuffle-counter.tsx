'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatLargeNumber } from '@/lib/utils'
import { STATS_REFRESH_INTERVAL } from '@/lib/constants'

interface GlobalShuffleCounterProps {
  initialGlobalCount?: number
  userShuffleCount?: number
  userStreak?: number
}

// Create a refresh function at module scope
let refreshStatsFunction: (() => void) | null = null

// Function to be called from other components to trigger refresh
export function refreshShuffleStats() {
  if (refreshStatsFunction) {
    refreshStatsFunction()
  }
}

export function GlobalShuffleCounter({
  initialGlobalCount = 0,
  userShuffleCount = 0,
  userStreak = 0,
}: GlobalShuffleCounterProps) {
  const [globalCount, setGlobalCount] = useState(initialGlobalCount)
  const [userCount, setUserCount] = useState(userShuffleCount)
  const [streak, setStreak] = useState(userStreak)

  // Set initial user count from props and update when props change
  useEffect(() => {
    setUserCount(userShuffleCount || 0)
    setStreak(userStreak || 0)
  }, [userShuffleCount, userStreak])

  // Create a function to fetch all stats from the database
  const fetchAllStats = useCallback(async () => {
    try {
      // Fetch global count
      const response = await fetch('/api/shuffles/global-count')
      if (response.ok) {
        const data = await response.json()
        setGlobalCount(data.count)

        // If the API includes user stats, update those too
        if (data.userStats) {
          setUserCount(data.userStats.total_shuffles || 0)
          setStreak(data.userStats.shuffle_streak || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching shuffle stats:', error)
    }
  }, [])

  // Register the refresh function at the module level
  useEffect(() => {
    refreshStatsFunction = fetchAllStats
    return () => {
      refreshStatsFunction = null
    }
  }, [fetchAllStats])

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Initial fetch
    fetchAllStats()

    // Set up interval for refreshing
    const intervalId = setInterval(fetchAllStats, STATS_REFRESH_INTERVAL)

    // Listen for stats update events
    const handleStatsUpdate = (event: CustomEvent) => {
      if (event.detail?.userStats) {
        const { userStats } = event.detail
        setUserCount(userStats.total_shuffles || 0)
        setStreak(userStats.shuffle_streak || 0)
      }
    }

    // Add event listener
    window.addEventListener('statsUpdate', handleStatsUpdate as EventListener)

    // Clean up on unmount
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('statsUpdate', handleStatsUpdate as EventListener)
    }
  }, [fetchAllStats])

  return (
    <div className='flex flex-wrap justify-center gap-4 md:gap-8 py-2'>
      <div className='flex items-center space-x-1'>
        <span className='text-foreground'>Global shuffles:</span>
        <span className='stat-value'>{formatLargeNumber(globalCount)}</span>
      </div>

      <div className='flex items-center space-x-1'>
        <span className='text-foreground'>Your shuffles:</span>
        <span className='stat-value'>{formatLargeNumber(userCount)}</span>
      </div>

      <div className='flex items-center space-x-1'>
        <span className='text-foreground'>Daily streak:</span>
        <span className='stat-value'>{streak}</span>
      </div>
    </div>
  )
}
