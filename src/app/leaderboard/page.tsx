import React from 'react'
import { Leaderboard } from '@/components/leaderboard'

export const metadata = {
  title: 'Leaderboard | Unique Shuffle',
  description: 'View top shufflers and their statistics',
}

export default function LeaderboardPage() {
  return (
    <main className='min-h-screen p-4 md:p-8'>
      <div className='max-w-[1400px] mx-auto'>
        <h1 className='text-2xl font-bold mb-6 text-slate-200'>Leaderboard</h1>
        <Leaderboard />
      </div>
    </main>
  )
}
