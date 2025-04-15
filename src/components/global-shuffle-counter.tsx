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

  // Create a function to fetch all stats from the database
  const fetchAllStats = useCallback(async () => {
    try {
      // Fetch global count
      const response = await fetch('/api/shuffles/global-count', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setGlobalCount(data.count)
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

    // Clean up on unmount
    return () => {
      clearInterval(intervalId)
    }
  }, [fetchAllStats])

  return (
    <div className='flex flex-wrap justify-center gap-4 md:gap-8 py-2'>
      <div className='flex items-center space-x-1'>
        <span className='text-foreground'>global shuffles:</span>
        <span className='stat-value animate-opacity-pulse-subtle'>
          {formatLargeNumber(globalCount)}
        </span>
      </div>

      <div className='flex items-center space-x-1'>
        <span className='text-foreground'>your shuffles:</span>
        <span className='stat-value animate-opacity-pulse-subtle'>
          {formatLargeNumber(userShuffleCount)}
        </span>
      </div>

      <div className='flex items-center space-x-1'>
        <span className='text-foreground'>streak:</span>
        <span className='stat-value animate-opacity-pulse-subtle'>{userStreak}</span>
      </div>
    </div>
  )
}
