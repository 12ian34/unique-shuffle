'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

interface LeaderboardEntry {
  username: string
  total_shuffles: number
  shuffle_streak: number
  achievements_count: number
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortColumn, setSortColumn] = useState<
    'total_shuffles' | 'shuffle_streak' | 'achievements_count'
  >('total_shuffles')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/leaderboard?sortBy=${sortColumn}&sortOrder=${sortDirection}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data')
      }

      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()

    // Add listener for custom refresh event
    const handleRefreshEvent = () => {
      console.log('Leaderboard received refresh-global-counter event')
      loadLeaderboard()
    }
    window.addEventListener('refresh-global-counter', handleRefreshEvent)

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, (payload) => {
        console.log('Leaderboard change received!', payload)
        loadLeaderboard() // Refresh leaderboard when changes occur
      })
      .subscribe()

    // Cleanup subscription
    return () => {
      window.removeEventListener('refresh-global-counter', handleRefreshEvent)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortColumn, sortDirection])

  const handleSort = (column: 'total_shuffles' | 'shuffle_streak' | 'achievements_count') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Default to descending for new column
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const renderSortIcon = (column: 'total_shuffles' | 'shuffle_streak' | 'achievements_count') => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼'
    }
    return ''
  }

  if (isLoading) {
    return <div className='text-slate-200 font-medium text-center py-4'>Loading leaderboard...</div>
  }

  return (
    <>
      <div className='max-w-full px-4 sm:px-0'>
        <div className='overflow-x-auto rounded-lg'>
          <div className='bg-slate-900/80 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-700/50 min-w-full'>
            <div className='grid grid-cols-12 text-xs font-semibold text-slate-300 uppercase tracking-wider bg-slate-800/80 px-3 py-3'>
              <div className='col-span-1 text-center'>#</div>
              <div className='col-span-4 pl-1'>Player</div>
              <div
                className='col-span-3 text-center cursor-pointer'
                onClick={() => handleSort('total_shuffles')}
              >
                Shuffles{renderSortIcon('total_shuffles')}
              </div>
              <div
                className='col-span-2 text-center cursor-pointer'
                onClick={() => handleSort('shuffle_streak')}
              >
                Streak{renderSortIcon('shuffle_streak')}
              </div>
              <div
                className='col-span-2 text-center cursor-pointer'
                onClick={() => handleSort('achievements_count')}
              >
                Achievements{renderSortIcon('achievements_count')}
              </div>
            </div>

            {entries.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  'grid grid-cols-12 items-center px-3 py-3 text-sm border-t border-slate-800/80',
                  index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-800/30'
                )}
              >
                <div className='col-span-1 font-semibold text-slate-300 text-center'>
                  {index + 1}
                </div>
                <div className='col-span-4 text-slate-300 truncate pl-1'>{entry.username}</div>
                <div className='col-span-3 text-slate-300 text-center'>{entry.total_shuffles}</div>
                <div className='col-span-2 text-slate-300 text-center'>{entry.shuffle_streak}</div>
                <div className='col-span-2 text-slate-300 text-center'>
                  {entry.achievements_count}
                </div>
              </div>
            ))}

            {entries.length === 0 && (
              <div className='px-4 py-6 text-center text-slate-400'>
                No entries yet. Be the first to join the leaderboard!
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
