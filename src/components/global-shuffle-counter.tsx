'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { cn } from '@/lib/utils'
import { UserStats } from '@/types'

interface GlobalShuffleCounterProps {
  variant?: 'navbar' | 'card'
  userStats?: UserStats
}

export function GlobalShuffleCounter({ variant = 'card', userStats }: GlobalShuffleCounterProps) {
  const [totalShuffles, setTotalShuffles] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const hasInitializedRef = useRef(false)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const lastFetchTimeRef = useRef<number>(0)

  // Use useMemo to ensure the supabase client isn't recreated on each render
  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  // Function to briefly show a highlight effect
  const highlightUpdate = useCallback(() => {
    setIsHighlighted(true)
    setTimeout(() => {
      setIsHighlighted(false)
    }, 1000)
  }, [])

  const fetchShuffleCounts = useCallback(
    async (forceReset = false) => {
      // Add rate limiting to prevent excessive API calls
      const now = Date.now()
      if (!forceReset && now - lastFetchTimeRef.current < 2000) {
        return
      }

      // Skip duplicate fetches if we're already loading
      if (isLoading && !forceReset) return

      try {
        lastFetchTimeRef.current = now
        setIsLoading(true)

        // Use a simple fetch with a proper timestamp parameter (not "_")
        // Using "t" as parameter name to avoid conflicts with other parameter names
        const response = await fetch(`/api/shuffle/count?t=${now}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch shuffle count')
        }

        const data = await response.json()

        if (data && typeof data.total === 'number') {
          // Force highlight when it's an explicit refresh or count increases
          if (forceReset || (data.total > totalShuffles && totalShuffles > 0)) {
            highlightUpdate()
          }
          setTotalShuffles(data.total)
        }
      } catch (error) {
        console.error('Failed to fetch shuffle counts:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [totalShuffles, highlightUpdate, isLoading]
  )

  // Setup subscriptions once on mount
  useEffect(() => {
    // Only setup once
    if (subscriptionRef.current) return

    // Initial data fetch
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      fetchShuffleCounts(true)
    }

    // Add listener for custom refresh event
    const handleRefreshEvent = () => {
      fetchShuffleCounts(true)
    }
    window.addEventListener('refresh-global-counter', handleRefreshEvent)

    // Periodic refresh - use a longer interval to reduce server load
    const intervalId = setInterval(() => fetchShuffleCounts(false), 60000) // Refresh every 60 seconds

    // Store subscription reference for cleanup
    subscriptionRef.current = {
      unsubscribe: () => {
        window.removeEventListener('refresh-global-counter', handleRefreshEvent)
        clearInterval(intervalId)
      },
    }

    // Cleanup on component unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [fetchShuffleCounts])

  if (variant === 'navbar') {
    return (
      <div className='flex items-center'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5'>
            <span className='text-gray-400 text-xs font-medium'>global shuffles:</span>
            <span
              className={cn(
                'font-bold text-sm transition-colors duration-300',
                isHighlighted ? 'text-green-400' : 'text-indigo-400'
              )}
              onClick={() => fetchShuffleCounts(true)}
              style={{ cursor: 'pointer' }}
              title='Click to refresh count'
            >
              {isLoading ? '...' : totalShuffles.toLocaleString()}
            </span>
          </div>

          {userStats && (
            <>
              <div className='flex items-center gap-1.5'>
                <span className='text-gray-400 text-xs font-medium'>your shuffles:</span>
                <span className='font-bold text-sm text-indigo-400'>
                  {userStats.total_shuffles.toLocaleString()}
                </span>
              </div>

              <div className='flex items-center gap-1.5'>
                <span className='text-gray-400 text-xs font-medium'>streak:</span>
                <span className='font-bold text-sm text-indigo-400'>
                  {userStats.shuffle_streak.toLocaleString()}{' '}
                  {userStats.shuffle_streak === 1 ? 'day' : 'days'}
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
            isHighlighted ? 'text-green-400' : 'text-indigo-400'
          }`}
          onClick={() => fetchShuffleCounts(true)}
          style={{ cursor: 'pointer' }}
          title='Click to refresh count'
        >
          {isLoading ? '...' : totalShuffles.toLocaleString()}
        </span>
      </div>

      {/* User stats */}
      {userStats && (
        <div className='pt-4 border-t border-slate-700/50 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-slate-400'>Your shuffles:</span>
            <span className='text-2xl font-bold text-indigo-400'>
              {userStats.total_shuffles.toLocaleString()}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-slate-400'>Your streak:</span>
            <span className='text-2xl font-bold text-indigo-400'>
              {userStats.shuffle_streak.toLocaleString()}{' '}
              {userStats.shuffle_streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
