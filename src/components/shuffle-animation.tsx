'use client'

import { useState, useEffect, useRef } from 'react'
import { Card as CardType } from '@/types'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface ShuffleAnimationProps {
  cards: CardType[]
  onCompleteAction: () => void
  className?: string
}

export function ShuffleAnimation({ cards, onCompleteAction, className }: ShuffleAnimationProps) {
  const [animationStage, setAnimationStage] = useState<
    'initial' | 'shuffling' | 'spreading' | 'complete'
  >('initial')

  // Use a ref to track if the animation has completed
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    // Reset completion state when new animation starts
    hasCompletedRef.current = false

    // Start the animation sequence
    const animationSequence = async () => {
      // Initial state
      setAnimationStage('initial')
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Shuffle animation
      setAnimationStage('shuffling')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Spread animation
      setAnimationStage('spreading')
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Complete
      setAnimationStage('complete')

      // Let parent know we're done, but only if not already completed
      setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true
          onCompleteAction()
        }
      }, 200)
    }

    animationSequence()

    // Return cleanup function
    return () => {
      // Mark as completed on unmount to prevent late callbacks
      hasCompletedRef.current = true
    }
    // Include onCompleteAction in the dependency array
  }, [cards, onCompleteAction])

  return (
    <div className={cn('relative w-full h-[50vh] overflow-hidden', className)}>
      <div
        className={cn(
          'grid grid-cols-4 md:grid-cols-13 gap-2 transition-all duration-500',
          animationStage === 'initial' && 'scale-0 opacity-0',
          animationStage === 'shuffling' && 'scale-50 opacity-100 rotate-180',
          animationStage === 'spreading' && 'scale-90 opacity-100 rotate-0',
          animationStage === 'complete' && 'scale-100 opacity-100'
        )}
      >
        {cards.map((card) => (
          <Card key={card.index} card={card} isHighlighted={false} />
        ))}
      </div>
    </div>
  )
}
