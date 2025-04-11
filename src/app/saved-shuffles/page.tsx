'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { ShuffleHistory } from '@/components/shuffle-history'

export default function SavedShufflesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setIsAuthenticated(!!data.user)
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen p-4 md:p-8'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-2xl font-bold mb-6'>Saved Shuffles</h1>
          <div className='bg-slate-800 p-6 rounded-lg'>
            <p className='text-center text-slate-300 mb-4'>
              You need to be logged in to view your saved shuffles.
            </p>
            <div className='flex justify-center'>
              <a
                href='/auth'
                className='bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded'
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-slate-800 p-6 rounded-lg'>
          <ShuffleHistory />
        </div>
      </div>
    </div>
  )
}
