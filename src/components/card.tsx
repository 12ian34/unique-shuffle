'use client'

import { memo, useMemo } from 'react'
import { Card as CardType } from '@/types'
import { cn } from '@/lib/utils'

interface CardProps {
  card: CardType
  className?: string
  index?: number
}

// Helper functions moved outside component to avoid recreation on each render
const getSuitColor = (suit: CardType['suit']) => {
  if (suit === 'hearts' || suit === 'diamonds') {
    return 'text-red-500'
  }
  return 'text-slate-900'
}

const getCardFont = (value: string) => {
  // Use different font styles for letter cards (A, J, Q, K) vs number cards
  return ['A', 'J', 'Q', 'K'].includes(value)
    ? 'font-serif italic font-bold tracking-tighter'
    : 'font-serif font-black tracking-tight'
}

const getSuitSymbol = (suit: CardType['suit']) => {
  switch (suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
  }
}

// Base card class - doesn't change between renders, so extract it
const baseCardClasses =
  'rounded-lg flex flex-col justify-between overflow-hidden backdrop-blur-sm relative z-10 transition-all duration-300 ease-out transform-gpu cursor-pointer'

// Card component with optimizations
function CardComponent({ card, className, index = 0 }: CardProps) {
  // Logging to verify style changes
  console.log('Rendering card with updated styling', {
    cardValue: card.value,
    cardSuit: card.suit,
    index,
  })

  // Memoize values that depend on props to prevent recalculation on every render
  const cardDetails = useMemo(() => {
    const suitSymbol = getSuitSymbol(card.suit)
    const suitColor = getSuitColor(card.suit)
    const cardFont = getCardFont(card.value)
    const isRedSuit = card.suit === 'hearts' || card.suit === 'diamonds'

    return {
      suitSymbol,
      suitColor,
      cardFont,
      isRedSuit,
    }
  }, [card.suit, card.value])

  // Memoize card dimensions classes to avoid string concatenation on each render
  const cardDimensionsClass = useMemo(() => {
    // Adjusted width to match the second screenshot (narrower cards)
    return 'w-[60px] sm:w-[70px] md:w-[75px] h-[110px] sm:h-[125px] md:h-[135px]'
  }, [])

  // Memoize hover effect classes
  const hoverEffectClass = useMemo(() => {
    return 'group-hover:translate-y-[-8px] group-hover:rotate-1 active:translate-y-[-4px] active:rotate-0 active:scale-[0.98]'
  }, [])

  return (
    <div className='relative group flex justify-center'>
      {/* Modern drop shadow for 3D effect - simplified for better performance */}
      <div className='absolute -inset-1 rounded-lg bg-gradient-to-r from-indigo-500/30 to-purple-600/30 opacity-0 group-hover:opacity-100 blur transition duration-300 group-hover:duration-200' />

      <div
        className={cn(
          // Card dimensions
          cardDimensionsClass,
          // Modern glass-like appearance with base classes
          baseCardClasses,
          // Animation classes
          hoverEffectClass,
          className
        )}
        style={{
          background:
            'linear-gradient(135deg, rgba(235, 240, 250, 0.97) 0%, rgba(200, 210, 230, 0.97) 55%, rgba(180, 195, 225, 0.97) 100%)',
          boxShadow:
            '0 10px 30px -5px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
          borderTop: '1px solid rgba(255, 255, 255, 0.9)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.7)',
          borderRight: '1px solid rgba(150, 170, 200, 0.5)',
          borderBottom: '1px solid rgba(150, 170, 200, 0.6)',
        }}
      >
        {/* Card number sticker - moved to top right of card */}
        <div className='absolute top-1 right-1 w-7 h-7 flex items-center justify-center z-30 rotate-2 transform-gpu group-hover:rotate-3 transition-transform duration-300'>
          {/* Combined sticker effects for fewer DOM elements */}
          <div
            className='absolute inset-0 rounded-full'
            style={{
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(99, 102, 241, 0.6)',
            }}
          />

          {/* Sticker text */}
          <span
            className='relative text-white text-sm font-medium z-10'
            style={{
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Simplified card surface texture with fewer elements */}
        <div
          className='absolute inset-0 z-0 pointer-events-none opacity-70'
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
          }}
        />

        {/* Top-left corner - horizontal layout like real cards */}
        <div className={cn('p-1 z-10 relative', cardDetails.suitColor)}>
          <div className='flex items-center gap-px'>
            <span
              className={cn(
                'text-[1rem] sm:text-[1.2rem] leading-none font-bold',
                cardDetails.cardFont
              )}
            >
              {card.value}
            </span>
            <span className='text-[1rem] sm:text-[1.2rem] leading-none'>
              {cardDetails.suitSymbol}
            </span>
          </div>
        </div>

        {/* Center emblem - larger for visual appeal */}
        <div
          className={cn(
            'text-[2rem] sm:text-[2.4rem] self-center z-10 relative',
            cardDetails.suitColor,
            cardDetails.isRedSuit
              ? 'drop-shadow-md'
              : 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]'
          )}
        >
          {cardDetails.suitSymbol}
        </div>

        {/* Bottom-right corner - properly positioned and sized */}
        <div className={cn('p-1 self-end z-10 relative', cardDetails.suitColor)}>
          <div className='flex items-center gap-px rotate-180'>
            <span
              className={cn(
                'text-[1rem] sm:text-[1.2rem] leading-none font-bold',
                cardDetails.cardFont
              )}
            >
              {card.value}
            </span>
            <span className='text-[1rem] sm:text-[1.2rem] leading-none'>
              {cardDetails.suitSymbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export memoized component to prevent unnecessary re-renders when props haven't changed
export const Card = memo(CardComponent)
