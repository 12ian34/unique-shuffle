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
      const response = await fetch('/api/shuffles/global-count')
      const data = await response.json()

      if (data && typeof data.count === 'number') {
        setGlobalCount(data.count)
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shuffles' }, () => {
        // Increment the counter immediately for responsive UI
        setGlobalCount((prev) => prev + 1)
        // Also fetch the accurate count from the backend periodically
        if (Math.random() < 0.1) {
          // Only fetch 10% of the time to reduce load
          fetchGlobalCount()
        }
      })
      .subscribe()

    // Refresh the count periodically to ensure accuracy
    const intervalId = setInterval(fetchGlobalCount, 60000) // Update every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex items-center'>
      <div className='flex items-center gap-1.5'>
        <span className='text-gray-400 text-xs font-medium'>global shuffles:</span>
        <span className='text-indigo-400 font-bold text-sm'>
          {loading ? '...' : globalCount.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
