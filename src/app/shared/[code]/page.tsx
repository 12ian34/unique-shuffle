'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/card'
import { Button } from '@/components/ui/button'
import { Card as CardType } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Memoize the Card component for better performance
const MemoizedCard = memo(Card)

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
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params
        setCode(decodeURIComponent(resolvedParams.code))
        console.log(
          'Resolved share code from URL:',
          resolvedParams.code,
          'Decoded:',
          decodeURIComponent(resolvedParams.code)
        )
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
        console.log('Attempting to load shared shuffle with code:', code)

        // Get current user if logged in
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        // Fetch the shared shuffle
        const response = await fetch(`/api/shuffle/shared?code=${code}`)

        const data = await response.json()

        if (!response.ok) {
          console.error('API response error:', data)
          throw new Error(data.error || 'Shuffle not found')
        }

        if (!data.shuffle) {
          console.error('No shuffle data returned:', data)
          throw new Error('No shuffle data returned from API')
        }

        console.log('Successfully loaded shared shuffle:', data.shuffle.id)
        setShuffle(data.shuffle)
      } catch (error) {
        console.error('Error loading shared shuffle:', error)
        setError(
          error instanceof Error
            ? error.message
            : 'This shared shuffle could not be found or has been removed.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadSharedShuffle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const shuffleDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - shuffleDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'less than a minute ago'
    if (diffInMinutes === 1) return '1 minute ago'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

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

      alert('Shuffle saved to your collection!')
    } catch (error) {
      console.error('Failed to save shuffle:', error)
      alert('Failed to save shuffle')
    }
  }

  const handleCardClick = (index: number) => {
    setSelectedCardIndex(selectedCardIndex === index ? null : index)
  }

  const copyShareLink = () => {
    try {
      const url = window.location.href
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-slate-300'>Loading shared shuffle...</p>
      </div>
    )
  }

  if (error || !shuffle) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center p-4'>
        <h1 className='text-2xl font-bold mb-4'>Shuffle Not Found</h1>
        <p className='text-center mb-6 text-slate-300'>
          {error || 'This shared shuffle could not be found.'}
        </p>
        <Link href='/'>
          <Button variant='default'>Return Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <main className='min-h-screen p-4 md:p-8'>
      <div className='max-w-[1400px] mx-auto'>
        {shuffle.created_at && (
          <div className='text-slate-300 text-sm mb-3'>{formatTimeAgo(shuffle.created_at)}</div>
        )}

        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-slate-200'>Shared Shuffle</h1>
          <div className='flex gap-4'>
            <div className='flex justify-center gap-4 mb-0'>
              <Button
                onClick={copyShareLink}
                className='bg-indigo-700 hover:bg-indigo-800 text-white font-medium transition-all duration-200 min-w-[120px]'
              >
                {copied ? 'copied!' : 'share'}
              </Button>
              {user && (
                <Button
                  onClick={saveShuffle}
                  className='bg-emerald-700 hover:bg-emerald-800 text-white font-medium min-w-[120px]'
                >
                  save shuffle
                </Button>
              )}
            </div>
            <Link href='/'>
              <Button
                variant='outline'
                className='border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white'
              >
                Return Home
              </Button>
            </Link>
          </div>
        </div>

        <div className='bg-slate-800 rounded-lg p-4 sm:p-6 shadow-inner mb-6'>
          <div className='flex justify-between items-center mb-3 sm:mb-5'>
            <div className='text-slate-400 text-xs sm:text-sm'>
              {shuffle.cards.length} cards, shared shuffle
            </div>
          </div>

          <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 gap-2'>
            {shuffle.cards.map((card, index) => (
              <div
                key={`${card.suit}-${card.value}-${index}`}
                className={`flex justify-center items-center ${
                  selectedCardIndex === index ? 'ring-2 ring-indigo-400 rounded-lg' : ''
                }`}
                onClick={() => handleCardClick(index)}
              >
                <MemoizedCard card={card} index={index} />
              </div>
            ))}
          </div>
        </div>

        {!user && (
          <div className='bg-slate-800 p-6 rounded-lg mb-6'>
            <p className='text-center text-slate-300 mb-4'>
              Sign in to save this shuffle to your collection!
            </p>
            <div className='flex justify-center'>
              <Link href='/auth'>
                <Button variant='outline' className='text-slate-200 hover:bg-slate-700'>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
