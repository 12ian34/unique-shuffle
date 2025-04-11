'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function GlobalShuffleCount() {
  const [globalCount, setGlobalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchGlobalCount = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shuffles/count')
      const data = await response.json()

      if (data && (typeof data.count === 'number' || typeof data.total === 'number')) {
        const count = typeof data.count === 'number' ? data.count : data.total
        setGlobalCount(count)
      }
    } catch (error) {
      console.error('Failed to fetch global shuffle count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGlobalCount()

    // Subscribe to shuffle changes to update the count in real-time
    const subscription = supabase
      .channel('shuffles_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_shuffles' },
        (payload) => {
          // Check if the shuffle belongs to a user on the leaderboard
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
            // Fetch the accurate count from the backend after each shuffle
            // to ensure we only count shuffles from leaderboard users
            fetchGlobalCount()
          }
        }
      )
      .subscribe()

    // Refresh the count periodically to ensure accuracy
    const intervalId = setInterval(fetchGlobalCount, 60000) // Update every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render loading state or counter
  if (loading) {
    return <div className='text-sm text-gray-400'>Loading...</div>
  }

  return (
    <div className='text-sm'>
      <span className='font-semibold'>{globalCount.toLocaleString()}</span> shuffles
    </div>
  )
}
