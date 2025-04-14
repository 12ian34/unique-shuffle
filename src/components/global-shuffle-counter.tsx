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
    console.log('GlobalShuffleCounter props updated:', { userShuffleCount, userStreak })
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
        console.log('Stats fetch response:', data)
        setGlobalCount(data.count)

        // If the API includes user stats, update those too
        if (data.userStats) {
          console.log('User stats received:', data.userStats)
          setUserCount(data.userStats.total_shuffles || 0)
          setStreak(data.userStats.shuffle_streak || 0)
        } else {
          console.log('No user stats in response - user might not be authenticated')
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
      console.log('Received stats update event:', event.detail)
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
    <div className='flex flex-wrap justify-center gap-4 md:gap-8'>
      <div className='flex items-center space-x-1'>
        <span className='font-medium'>Global shuffles:</span>
        <span>{formatLargeNumber(globalCount)}</span>
      </div>

      <div className='flex items-center space-x-1'>
        <span className='font-medium'>Your shuffles:</span>
        <span>{formatLargeNumber(userCount)}</span>
      </div>

      <div className='flex items-center space-x-1'>
        <span className='font-medium'>Daily streak:</span>
        <span>{streak}</span>
      </div>
    </div>
  )
}
