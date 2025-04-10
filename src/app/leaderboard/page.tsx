import React from 'react'
import { Leaderboard } from '@/components/leaderboard'

export const metadata = {
  title: 'Leaderboard | Unique Shuffle',
  description: 'View top shufflers and their statistics',
}

export default function LeaderboardPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6 text-slate-100'>Leaderboard</h1>
      <div className='bg-slate-900 rounded-lg shadow-md p-6 border border-slate-700'>
        <Leaderboard />
      </div>
    </div>
  )
}
