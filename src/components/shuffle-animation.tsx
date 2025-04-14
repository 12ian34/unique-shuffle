'use client'

import { useState, useEffect, useRef } from 'react'
import { Card as CardType, Deck } from '@/types'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface ShuffleAnimationProps {
  deck: Deck
  onCompleteAction: () => void
  isShuffling: boolean
  className?: string
}

export function ShuffleAnimation({
  deck,
  onCompleteAction,
  isShuffling,
  className,
}: ShuffleAnimationProps) {
  const [animationStage, setAnimationStage] = useState<
    'initial' | 'fan' | 'shuffle' | 'arrange' | 'complete'
  >('initial')

  // Use a ref to track if the animation has completed
  const hasCompletedRef = useRef(false)

  // Total animation duration
  const totalAnimationDuration = 2500 // 2.5 seconds total

  // Track if this is mobile view
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Generate styles for each card during different animation phases
  const getCardStyle = (index: number) => {
    // Calculate position in the grid
    const columns = isMobile ? 4 : 13
    const totalRows = Math.ceil(deck.length / columns)
    const row = Math.floor(index / columns)
    const column = index % columns

    if (animationStage === 'initial') {
      return {
        opacity: 0,
        transform: 'translateY(10px)',
        zIndex: index,
      }
    }

    if (animationStage === 'fan') {
      // Create a gentle fan effect
      const angle = (index - deck.length / 2) * 1.5
      const radius = 400
      const x = Math.sin(angle * (Math.PI / 180)) * radius * 0.15
      const y = Math.cos(angle * (Math.PI / 180)) * radius * 0.05 - 50

      return {
        opacity: 1,
        transform: `translate(${x}px, ${y}px)`,
        zIndex: index,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        transition: 'all 700ms cubic-bezier(0.16, 1, 0.3, 1)',
      }
    }

    if (animationStage === 'shuffle') {
      // Create a cascading shuffle effect
      const isOdd = index % 2 === 1
      const group = Math.floor(index / 2)
      const delay = group * 15
      const xOffset = isOdd ? 15 : -15
      const yOffset = -5 + group * 0.5

      return {
        opacity: 1,
        transform: `translate(${xOffset}px, ${yOffset}px)`,
        zIndex: deck.length - group,
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: `all 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }
    }

    if (animationStage === 'arrange') {
      // Position cards into their final grid with staggered timing
      const delay = index * 8

      return {
        opacity: 1,
        transform: 'translate(0, 0)',
        zIndex: deck.length - index,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: `all 450ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }
    }

    if (animationStage === 'complete') {
      return {
        opacity: 1,
        transform: 'translate(0, 0)',
        zIndex: deck.length - index,
        transition: 'all 300ms ease',
      }
    }

    return {}
  }

  // Run the animation sequence
  useEffect(() => {
    // Reset completion state when new animation starts
    hasCompletedRef.current = false

    // Start the animation sequence
    const animationSequence = async () => {
      // Initial state
      setAnimationStage('initial')
      await new Promise((resolve) => setTimeout(resolve, totalAnimationDuration * 0.1))

      // Fan out the cards
      setAnimationStage('fan')
      await new Promise((resolve) => setTimeout(resolve, totalAnimationDuration * 0.25))

      // Shuffle
      setAnimationStage('shuffle')
      await new Promise((resolve) => setTimeout(resolve, totalAnimationDuration * 0.35))

      // Arrange into grid
      setAnimationStage('arrange')
      await new Promise((resolve) => setTimeout(resolve, totalAnimationDuration * 0.25))

      // Complete
      setAnimationStage('complete')

      // Let parent know we're done
      setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true
          onCompleteAction()
        }
      }, totalAnimationDuration * 0.05)
    }

    animationSequence()

    // Cleanup
    return () => {
      hasCompletedRef.current = true
    }
  }, [deck, onCompleteAction, totalAnimationDuration])

  return (
    <div className={cn('relative w-full h-[50vh] overflow-hidden', className)}>
      <div className='w-full h-full flex items-center justify-center'>
        <div
          className={cn(
            'w-full grid',
            animationStage === 'initial' && 'grid-cols-4 md:grid-cols-13 gap-2 opacity-0',
            animationStage === 'fan' && 'grid-cols-1 opacity-100',
            animationStage === 'shuffle' && 'grid-cols-1 opacity-100',
            (animationStage === 'arrange' || animationStage === 'complete') &&
              'grid-cols-4 md:grid-cols-13 gap-2 opacity-100'
          )}
        >
          {deck.map((card, index) => (
            <div
              key={card.index}
              className={cn(
                'relative transition-all',
                (animationStage === 'fan' || animationStage === 'shuffle') &&
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                animationStage === 'complete' && 'hover:-translate-y-1'
              )}
              style={getCardStyle(index)}
            >
              <Card
                card={card}
                isHighlighted={false}
                className={cn(
                  'transition-transform',
                  animationStage === 'complete' && 'hover:shadow-md'
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {isShuffling && animationStage !== 'complete' && (
        <div
          className='absolute inset-0 flex items-center justify-center pointer-events-none'
          style={{ zIndex: 9999 }}
        >
          <div
            className={cn(
              'relative transition-all duration-500 ease-out transform',
              animationStage === 'initial' && 'opacity-0 scale-95',
              (animationStage === 'fan' ||
                animationStage === 'shuffle' ||
                animationStage === 'arrange') &&
                'opacity-100 scale-100'
            )}
          >
            <div className='absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg blur-md opacity-75 animate-pulse'></div>
            <div className='relative bg-black/80 backdrop-blur-xl px-6 py-3 rounded-lg border border-white/10 shadow-2xl'>
              <div className='flex items-center gap-3'>
                <div className='w-3 h-3 rounded-full bg-indigo-500 animate-pulse'></div>
                <span className='text-white font-medium tracking-wide text-sm uppercase'>
                  {animationStage === 'fan' && 'Preparing cards'}
                  {animationStage === 'shuffle' && 'Shuffling deck'}
                  {animationStage === 'arrange' && 'Arranging cards'}
                </span>
                <div className='w-3 h-3 rounded-full bg-pink-500 animate-pulse'></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
