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
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_shuffles', { ascending: false })
        .limit(10)

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()

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
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return <div className='text-slate-200 font-medium'>Loading leaderboard...</div>
  }

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold text-slate-100'>Global Leaderboard</h3>
      <div className='bg-slate-900 rounded-lg shadow-md overflow-hidden border border-slate-700'>
        <table className='min-w-full divide-y divide-slate-800'>
          <thead className='bg-slate-800'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider'>
                Rank
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider'>
                Player
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider'>
                Shuffles
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider'>
                Streak Days
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider'>
                Achievements
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-800'>
            {entries.map((entry, index) => (
              <tr key={index} className={cn(index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50')}>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200'>
                  {index + 1}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                  {entry.username}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                  {entry.total_shuffles}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                  {entry.shuffle_streak}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                  {entry.achievements_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
