'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/card'
import { Button } from '@/components/ui/button'
import { Card as CardType } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

interface PageProps {
  params: Promise<{
    code: string
  }>
}

export default function SharedShuffle({ params }: PageProps) {
  const [code, setCode] = useState<string>('')
  const [shuffle, setShuffle] = useState<{
    id: number
    cards: CardType[]
    created_at: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params
        setCode(resolvedParams.code)
      } catch (error) {
        console.error('Error resolving params:', error)
        setError('Invalid parameters')
      }
    }

    loadParams()
  }, [params])

  useEffect(() => {
    if (!code) return

    const loadSharedShuffle = async () => {
      try {
        setLoading(true)

        // Get current user if logged in
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        // Fetch the shared shuffle
        const response = await fetch(`/api/shuffle/shared?code=${code}`)

        if (!response.ok) {
          throw new Error('Shuffle not found')
        }

        const data = await response.json()
        setShuffle(data.shuffle)
      } catch (error) {
        console.error('Error loading shared shuffle:', error)
        setError('This shared shuffle could not be found or has been removed.')
      } finally {
        setLoading(false)
      }
    }

    loadSharedShuffle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const saveShuffle = async () => {
    if (!user || !shuffle) return

    try {
      const response = await fetch('/api/shuffle/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards: shuffle.cards }),
      })

      if (!response.ok) {
        throw new Error('Failed to save shuffle')
      }

      // Log analytics for copy action
      await fetch('/api/shuffle/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shuffleId: typeof shuffle.id === 'string' ? parseInt(shuffle.id, 10) : shuffle.id,
          action: 'copy',
        }),
      })

      alert('Shuffle saved to your collection!')
    } catch (error) {
      console.error('Failed to save shuffle:', error)
      alert('Failed to save shuffle')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading shared shuffle...</p>
      </div>
    )
  }

  if (error || !shuffle) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center p-4'>
        <h1 className='text-2xl font-bold mb-4'>Shuffle Not Found</h1>
        <p className='text-center mb-6'>{error || 'This shared shuffle could not be found.'}</p>
        <Link href='/'>
          <Button variant='default'>Return Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6'>Shared Shuffle</h1>

        <div className='bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8'>
          <div className='grid grid-cols-4 gap-2 mb-6'>
            {shuffle.cards.map((card, index) => (
              <Card key={index} card={card} />
            ))}
          </div>

          {user && <Button onClick={saveShuffle}>Save to My Collection</Button>}

          {!user && (
            <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg'>
              <p className='text-sm'>Sign in to save this shuffle to your collection!</p>
              <Link href='/auth'>
                <Button variant='outline' className='mt-2'>
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className='text-center'>
          <Link href='/'>
            <Button variant='outline'>Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
