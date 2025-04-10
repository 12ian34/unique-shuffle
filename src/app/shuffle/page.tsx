'use client'

import React, { useState } from 'react'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { ShuffleHistory } from '@/components/shuffle-history'
import { Card as CardType } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export default function ShufflePage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveShuffle = async (cards: CardType[]) => {
    setIsSaving(true)

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Save the shuffle
      const response = await fetch('/api/shuffles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards, userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to save shuffle')
      }
    } catch (error) {
      console.error('Error saving shuffle:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6 text-slate-100'>Shuffle Cards</h1>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='bg-slate-900 rounded-lg shadow-md p-6 border border-slate-700'>
          <h2 className='text-xl font-semibold mb-4 text-slate-100'>Shuffle Generator</h2>
          <ShuffleDisplay onSaveShuffle={handleSaveShuffle} />
        </div>

        <div className='bg-slate-900 rounded-lg shadow-md p-6 border border-slate-700'>
          <ShuffleHistory />
        </div>
      </div>
    </div>
  )
}
