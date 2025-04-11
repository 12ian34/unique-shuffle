'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { Card } from '@/components/card'
import { Button } from '@/components/ui/button'
import { createDeck, shuffleDeck } from '@/lib/cards'
import { Card as CardType } from '@/types'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import dynamic from 'next/dynamic'

// Performance optimization: Memoize Card component to prevent unnecessary re-renders
const MemoizedCard = memo(Card)

interface ShuffleDisplayProps {
  onSaveShuffleAction: (cards: CardType[]) => Promise<void>
  className?: string
}

export function ShuffleDisplay({ onSaveShuffleAction, className }: ShuffleDisplayProps) {
  const [currentShuffle, setCurrentShuffle] = useState<CardType[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const lastShuffleTimeRef = useRef<number>(0)
  const initialLoadRef = useRef<boolean>(true)
  const [animateButton, setAnimateButton] = useState(false)

  // Initialize Supabase client - use useMemo to create only once
  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  // Load last shuffle on component mount - optimized to be faster
  useEffect(() => {
    async function loadLastShuffle() {
      try {
        // Performance improvement: First create a deck immediately to reduce perceived loading time
        if (initialLoadRef.current) {
          const initialDeck = createDeck()
          setCurrentShuffle(shuffleDeck(initialDeck))
          initialLoadRef.current = false
        }

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Fetch the most recent saved shuffle for this user
          const { data: shuffles, error } = await supabase
            .from('global_shuffles')
            .select('cards')
            .eq('user_id', user.id)
            .eq('is_saved', true)
            .order('created_at', { ascending: false })
            .limit(1)

          if (error) {
            // Keep the current shuffle if it exists, otherwise create a new one
            if (currentShuffle.length === 0) {
              const deck = createDeck()
              setCurrentShuffle(shuffleDeck(deck))
            }
          } else if (shuffles && shuffles.length > 0 && shuffles[0].cards) {
            // Use the last saved shuffle
            setCurrentShuffle(shuffles[0].cards)
          } else if (currentShuffle.length === 0) {
            // No previous shuffles found, create a new one if needed
            const deck = createDeck()
            setCurrentShuffle(shuffleDeck(deck))
          }
        } else if (currentShuffle.length === 0) {
          // No user logged in, create a new shuffle
          const deck = createDeck()
          setCurrentShuffle(shuffleDeck(deck))
        }
      } catch (error) {
        // Fall back to creating a new shuffle if needed
        if (currentShuffle.length === 0) {
          const deck = createDeck()
          setCurrentShuffle(shuffleDeck(deck))
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadLastShuffle()
  }, [supabase, currentShuffle.length]) // Include currentShuffle.length in dependencies

  const handleShuffle = async () => {
    // Rate limiting - prevent rapid shuffling (min 500ms between shuffles)
    const now = Date.now()
    if (now - lastShuffleTimeRef.current < 500) {
      return
    }
    lastShuffleTimeRef.current = now

    setIsShuffling(true)
    setSelectedCardIndex(null)

    // Trigger the animation with state
    setAnimateButton(true)

    // Create a new deck and immediately apply it for faster perceived performance
    const deck = createDeck()
    const shuffled = shuffleDeck(deck)
    setCurrentShuffle(shuffled)

    // Remove the DOM manipulation approach
    setTimeout(() => {
      setAnimateButton(false)
    }, 250)

    // Track the shuffle in the global counter asynchronously - don't wait for it
    try {
      fetch('/api/shuffle/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_saved: false,
          cards: shuffled,
        }),
      }).then(() => {
        // Only dispatch event after the API call is successful
        window.dispatchEvent(new CustomEvent('refresh-global-counter'))
      })
    } catch (trackError) {
      // Continue even if tracking fails
    } finally {
      // Set isShuffling to false much quicker for a fast animation
      setTimeout(() => {
        setIsShuffling(false)
      }, 250)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save the shuffle - this will now track in global_shuffles automatically
      await onSaveShuffleAction(currentShuffle)

      // Force refresh global counter and navbar stats
      window.dispatchEvent(new CustomEvent('refresh-global-counter'))
    } catch (error) {
      console.error('Failed to save shuffle:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCardClick = (index: number) => {
    if (isShuffling) return // Prevent selection during animation
    setSelectedCardIndex(selectedCardIndex === index ? null : index)
  }

  // Performance optimization: Split cards into chunks for rendering
  const cardChunks = useMemo(() => {
    if (!currentShuffle.length) return []

    // Create 4 chunks for better rendering performance
    const size = Math.ceil(currentShuffle.length / 4)
    return Array(4)
      .fill(null)
      .map((_, i) => currentShuffle.slice(i * size, (i + 1) * size))
  }, [currentShuffle])

  if (isLoading && currentShuffle.length === 0) {
    return (
      <div className={className}>
        <div className='flex justify-center items-center h-32 bg-slate-800 rounded-lg'>
          <p className='text-slate-300'>Loading your last shuffle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className='flex justify-center gap-4 mb-6'>
        <Button
          onClick={handleShuffle}
          disabled={isSaving || isShuffling}
          className={`bg-indigo-700 hover:bg-indigo-800 text-white font-medium transition-all duration-200 min-w-[120px]
            ${isShuffling ? 'scale-[0.98]' : ''} 
            ${animateButton ? 'animate-quick-shake' : ''}`}
        >
          {isShuffling ? 'shuffling...' : 'shuffle'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || isShuffling}
          className='bg-emerald-700 hover:bg-emerald-800 text-white font-medium min-w-[120px]'
        >
          {isSaving ? 'saving...' : 'save shuffle'}
        </Button>
      </div>

      <div className='bg-slate-800 rounded-lg p-4 sm:p-6 shadow-inner'>
        <div className='flex justify-between items-center mb-3 sm:mb-5'>
          <div className='text-slate-400 text-xs sm:text-sm'>
            {currentShuffle.length} cards, {isShuffling ? 'shuffling...' : 'your current shuffle'}
          </div>
        </div>

        <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 gap-2 place-items-center'>
          {cardChunks.map((chunk, chunkIndex) =>
            chunk.map((card, index) => {
              const actualIndex = chunkIndex * Math.ceil(currentShuffle.length / 4) + index
              return (
                <div
                  key={`${card.suit}-${card.value}-${actualIndex}`}
                  onClick={() => handleCardClick(actualIndex)}
                  className={`${
                    selectedCardIndex === actualIndex ? 'ring-2 ring-indigo-400 rounded-lg' : ''
                  } flex justify-center items-center`}
                  aria-label={`${card.value} of ${card.suit}, position ${actualIndex + 1}`}
                >
                  <MemoizedCard card={card} index={actualIndex} />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
