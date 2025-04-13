'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { Card } from '@/components/card'
import { Button } from '@/components/ui/button'
import { createDeck, shuffleDeck } from '@/lib/cards'
import { Card as CardType } from '@/types'
import { Database } from '@/types/supabase'
import dynamic from 'next/dynamic'
import { createDisabledRealtimeClient } from '@/lib/supabase-browser'

// Performance optimization: Memoize Card component to prevent unnecessary re-renders
const MemoizedCard = memo(Card)

interface ShuffleDisplayProps {
  onSaveShuffleAction: (cards: CardType[]) => Promise<void>
  className?: string
}

// App-wide flag to ensure we only attempt to load a saved shuffle once per session
// This prevents the app from making repeated database queries
let hasLoadedSavedShuffleGlobally = false

export function ShuffleDisplay({ onSaveShuffleAction, className }: ShuffleDisplayProps) {
  const [currentShuffle, setCurrentShuffle] = useState<CardType[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const lastShuffleTimeRef = useRef<number>(0)
  const initialLoadRef = useRef<boolean>(true)
  const [animateButton, setAnimateButton] = useState(false)
  const pendingTrackingRef = useRef<boolean>(false)
  const hasInitialLoadRef = useRef<boolean>(false)
  const [shuffleAnimation, setShuffleAnimation] = useState<
    'none' | 'shuffle-in-progress' | 'shuffle-complete'
  >('none')
  const nextShuffleRef = useRef<CardType[]>([])
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize a random deck immediately
  useEffect(() => {
    if (initialLoadRef.current) {
      // Create initial random deck
      const initialDeck = createDeck()
      setCurrentShuffle(shuffleDeck(initialDeck))
      initialLoadRef.current = false

      // Ensure we don't stay in loading state for too long
      loadTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
      }, 2000) // Fallback timeout to exit loading state
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [])

  // Only attempt to load user's saved shuffle once per app session
  useEffect(() => {
    // Skip if we've already tried to load a saved shuffle in this session
    if (hasInitialLoadRef.current || hasLoadedSavedShuffleGlobally) return
    hasInitialLoadRef.current = true
    hasLoadedSavedShuffleGlobally = true

    // Use direct API call instead of Supabase client to prevent internal polling
    const loadSavedShuffleOnce = async () => {
      try {
        // Call our API endpoint directly instead of using Supabase client
        const response = await fetch('/api/shuffle/last-saved', {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.shuffle && data.shuffle.cards) {
            setCurrentShuffle(data.shuffle.cards)
          }
        }
      } catch (error) {
        console.error('Error loading saved shuffle:', error)
      } finally {
        // Always exit loading state even if the fetch fails
        setIsLoading(false)
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
        }
      }
    }

    // Load saved shuffle once without blocking UI
    loadSavedShuffleOnce()
  }, [])

  // Fallback to ensure we never stay in loading state permanently
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Failsafe: Exiting loading state after timeout')
        setIsLoading(false)
      }
    }, 5000) // Exit loading state after 5 seconds max

    return () => clearTimeout(failsafeTimeout)
  }, [isLoading])

  const handleShuffle = async () => {
    // Rate limiting - prevent rapid shuffling (min 500ms between shuffles)
    // This is only for UI/UX purposes, not for tracking
    const now = Date.now()
    if (now - lastShuffleTimeRef.current < 500) {
      return
    }

    // Ensure the button stays disabled until the entire operation is complete
    setIsShuffling(true)
    lastShuffleTimeRef.current = now
    setSelectedCardIndex(null)

    // Trigger the animation with state
    setAnimateButton(true)

    // Create a new deck and prepare it, but don't immediately apply
    const deck = createDeck()
    const shuffled = shuffleDeck(deck)

    // Store the next shuffle but don't apply it yet
    nextShuffleRef.current = shuffled

    // Start the shuffle animation
    setShuffleAnimation('shuffle-in-progress')

    // After animation halfway point, update the actual cards
    setTimeout(() => {
      setCurrentShuffle(nextShuffleRef.current)
      setTimeout(() => {
        setShuffleAnimation('shuffle-complete')
      }, 100)
    }, 500)

    // Remove the button animation after a short delay
    setTimeout(() => {
      setAnimateButton(false)
    }, 250)

    // Track the shuffle in the global counter asynchronously
    try {
      // Only prevent concurrent tracking requests
      if (pendingTrackingRef.current) {
        console.log('Tracking request already in progress, will complete current shuffle operation')
        return
      }

      pendingTrackingRef.current = true

      // Track shuffle with a small delay to ensure UI updates first
      await new Promise((resolve) => setTimeout(resolve, 100))

      try {
        const response = await fetch('/api/shuffle/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_saved: false,
            cards: shuffled,
          }),
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to track shuffle')
        }

        const data = await response.json()
        console.log('Shuffle tracked successfully, current count:', data.count)

        // Update stats store directly instead of firing events
        if (typeof data.count === 'number') {
          // Import lazy to avoid circular dependency
          const statsStore = await import('@/lib/stats-store')
          // Update counts in the central store - this IS a user action
          // We need to update both global and user count on each shuffle
          statsStore.updateCountFromEvent(data.count, true)
        }

        // For better handling of events, dispatch a proper event too
        window.dispatchEvent(
          new CustomEvent('shuffle-completed', {
            detail: {
              timestamp: Date.now(),
              type: 'performed',
              count: data.count,
              // A regular shuffle updates global count and might update user count
              // if the user is logged in - the server handles this distinction
              isUserAction: true,
            },
          })
        )
      } catch (error) {
        console.error('Failed to track shuffle:', error)
      } finally {
        pendingTrackingRef.current = false
        // End the animation when tracking is complete
        setTimeout(() => {
          setShuffleAnimation('none')
          // Only now enable the shuffle button again
          setIsShuffling(false)
        }, 300)
      }
    } catch (trackError) {
      // Continue even if tracking fails
      console.error('Tracking error:', trackError)
      pendingTrackingRef.current = false
      setShuffleAnimation('none')
      setIsShuffling(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save the shuffle - this will now track in global_shuffles automatically
      await onSaveShuffleAction(currentShuffle)

      // Fetch the latest count and update the store
      try {
        // Make a lightweight request to get the current count
        const countResponse = await fetch('/api/shuffles/count', {
          method: 'GET',
          cache: 'no-store',
        })

        if (countResponse.ok) {
          const countData = await countResponse.json()
          const currentCount = countData.total || countData.count

          // Update the stats store directly
          if (typeof currentCount === 'number') {
            // Import lazy to avoid circular dependency
            const statsStore = await import('@/lib/stats-store')
            // Update counts in the central store - this IS a user action
            statsStore.updateCountFromEvent(currentCount, true)
          }

          // For better handling of events, dispatch a proper event too
          window.dispatchEvent(
            new CustomEvent('shuffle-completed', {
              detail: {
                timestamp: Date.now(),
                type: 'saved',
                count: currentCount,
                isUserAction: true, // Save IS a user action for stats purposes
              },
            })
          )
        }
      } catch (error) {
        console.error('Failed to get count after save:', error)
      }
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

  if (isLoading) {
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

      <div
        className={`bg-slate-800 rounded-lg p-4 sm:p-6 shadow-inner overflow-hidden relative ${
          shuffleAnimation !== 'none' ? 'perspective-1000' : ''
        }`}
      >
        <div className='flex justify-between items-center mb-3 sm:mb-5'>
          <div className='text-slate-400 text-xs sm:text-sm'>
            {currentShuffle.length} cards, {isShuffling ? 'shuffling...' : 'your current shuffle'}
          </div>
        </div>

        <style jsx global>{`
          @keyframes shuffle-out {
            0% {
              transform: translateY(0) rotateX(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(40px) rotateX(-90deg) scale(0.8);
              opacity: 0;
            }
          }

          @keyframes shuffle-in {
            0% {
              transform: translateY(-40px) rotateX(90deg) scale(0.8);
              opacity: 0;
            }
            100% {
              transform: translateY(0) rotateX(0) scale(1);
              opacity: 1;
            }
          }

          .shuffle-in-progress .card-container {
            animation: shuffle-out 0.5s cubic-bezier(0.33, 1, 0.68, 1) forwards;
          }

          .shuffle-complete .card-container {
            animation: shuffle-in 0.5s cubic-bezier(0.33, 1, 0.68, 1) forwards;
          }

          .card-container {
            will-change: transform, opacity;
            transform-style: preserve-3d;
            backface-visibility: hidden;
          }
        `}</style>

        <div
          className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 gap-2 place-items-center ${shuffleAnimation}`}
        >
          {cardChunks.map((chunk, chunkIndex) =>
            chunk.map((card, index) => {
              const actualIndex = chunkIndex * Math.ceil(currentShuffle.length / 4) + index
              const animationDelay = `${(actualIndex % 13) * 0.03}s`

              return (
                <div
                  key={`${card.suit}-${card.value}-${actualIndex}`}
                  onClick={() => handleCardClick(actualIndex)}
                  className={`card-container ${
                    selectedCardIndex === actualIndex ? 'ring-2 ring-indigo-400 rounded-lg' : ''
                  } flex justify-center items-center`}
                  style={{ animationDelay }}
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
