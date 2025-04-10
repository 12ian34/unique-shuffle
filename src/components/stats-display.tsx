'use client'

import { UserStats } from '@/types'

interface StatsDisplayProps {
  stats: UserStats
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className='space-y-4'>
      <h2 className='text-2xl font-semibold text-slate-100'>Your Statistics</h2>
      <div className='grid grid-cols-2 gap-4'>
        <div className='p-4 bg-slate-800 rounded-lg shadow border border-slate-700'>
          <h3 className='text-lg font-medium text-slate-300'>Your Shuffles</h3>
          <p className='text-3xl font-bold text-slate-100'>{stats.total_shuffles}</p>
        </div>
        <div className='p-4 bg-slate-800 rounded-lg shadow border border-slate-700'>
          <h3 className='text-lg font-medium text-slate-300'>Shuffle Streak</h3>
          <p className='text-3xl font-bold text-slate-100'>
            {stats.shuffle_streak} {stats.shuffle_streak === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </div>
  )
}
