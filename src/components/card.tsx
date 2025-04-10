'use client'

import { Card as CardType } from '@/types'
import { cn } from '@/lib/utils'

interface CardProps {
  card: CardType
  className?: string
  index?: number
}

export function Card({ card, className, index = 0 }: CardProps) {
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

  const suitSymbol = getSuitSymbol(card.suit)
  const suitColor = getSuitColor(card.suit)
  const cardFont = getCardFont(card.value)
  const isRedSuit = card.suit === 'hearts' || card.suit === 'diamonds'

  return (
    <div className='relative group'>
      {/* Modern drop shadow for 3D effect */}
      <div className='absolute -inset-1 rounded-lg bg-gradient-to-r from-indigo-500/30 to-purple-600/30 opacity-0 group-hover:opacity-100 blur transition duration-500 group-hover:duration-200' />

      {/* Card number sticker - positioned on top as a separate layer */}
      <div className='absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center z-30 rotate-2 transform-gpu group-hover:rotate-3 transition-transform duration-300'>
        {/* Sticker shadow */}
        <div
          className='absolute inset-0 rounded-full opacity-30'
          style={{
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            transform: 'translateY(0.5px)',
          }}
        ></div>

        {/* Sticker background with slight tilt */}
        <div
          className='absolute inset-0 rounded-full'
          style={{
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(99, 102, 241, 0.6)',
          }}
        ></div>

        {/* Sticker shine effect - more subtle */}
        <div
          className='absolute inset-0 rounded-full overflow-hidden opacity-50'
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 60%)',
            clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0% 25%)',
          }}
        ></div>

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

      <div
        className={cn(
          // Card dimensions
          'w-[70px] sm:w-[80px] md:w-[85px]',
          'h-[110px] sm:h-[125px] md:h-[135px]',
          // Modern glass-like appearance
          'rounded-lg flex flex-col justify-between overflow-hidden backdrop-blur-sm',
          // Ensure it's above the shadow
          'relative z-10',
          // Improved transition for hover with rotate effect
          'transition-all duration-300 ease-out',
          'transform-gpu group-hover:translate-y-[-8px] group-hover:rotate-1',
          'cursor-pointer',
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
        {/* Card surface texture - avoid center area */}
        <div
          className='absolute inset-x-0 top-0 h-1/4 z-0 pointer-events-none opacity-80'
          style={{
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
          }}
        />
        <div
          className='absolute inset-x-0 bottom-0 h-1/4 z-0 pointer-events-none opacity-70'
          style={{
            background: 'linear-gradient(to top, rgba(180, 195, 220, 0.4) 0%, transparent 100%)',
          }}
        />
        <div
          className='absolute inset-y-0 left-0 w-1/4 z-0 pointer-events-none opacity-70'
          style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
          }}
        />
        <div
          className='absolute inset-y-0 right-0 w-1/4 z-0 pointer-events-none opacity-70'
          style={{
            background: 'linear-gradient(to left, rgba(180, 195, 220, 0.3) 0%, transparent 100%)',
          }}
        />

        {/* Top-left corner - horizontal layout like real cards */}
        <div className={cn('p-1 z-10 relative', suitColor)}>
          <div className='flex items-center gap-px'>
            <span className={cn('text-[1rem] sm:text-[1.2rem] leading-none font-bold', cardFont)}>
              {card.value}
            </span>
            <span className='text-[1rem] sm:text-[1.2rem] leading-none'>{suitSymbol}</span>
          </div>
        </div>

        {/* Center emblem - larger for visual appeal */}
        <div
          className={cn(
            'text-[2rem] sm:text-[2.4rem] self-center z-10 relative',
            suitColor,
            isRedSuit ? 'drop-shadow-md' : 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]'
          )}
        >
          {suitSymbol}
        </div>

        {/* Bottom-right corner - properly positioned and sized */}
        <div className={cn('p-1 self-end z-10 relative', suitColor)}>
          <div className='flex items-center gap-px rotate-180'>
            <span className={cn('text-[1rem] sm:text-[1.2rem] leading-none font-bold', cardFont)}>
              {card.value}
            </span>
            <span className='text-[1rem] sm:text-[1.2rem] leading-none'>{suitSymbol}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
