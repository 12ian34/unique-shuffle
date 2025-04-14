'use client'

import Image from 'next/image'
import { Card as CardType } from '@/types'
import { cn } from '@/lib/utils'

interface CardProps {
  card: CardType
  isHighlighted?: boolean
  className?: string
}

export function Card({ card, isHighlighted = false, className }: CardProps) {
  const { rank, suit, color } = card

  // Get the appropriate symbol for the card suit
  const suitSymbol = getSuitSymbol(suit)

  const textColorClass = color === 'red' ? 'text-red-600' : 'text-gray-900'
  const gradientClass =
    color === 'red'
      ? 'bg-gradient-to-br from-white via-rose-50 to-rose-100'
      : 'bg-gradient-to-br from-white via-blue-50 to-slate-200'

  // Get face card image if applicable
  const isFaceCard = ['J', 'Q', 'K'].includes(rank)
  const faceCardImage = isFaceCard ? getFaceCardImage(rank, suit) : null

  return (
    <div
      className={cn(
        'aspect-[2/3] rounded-lg border border-white/40 flex flex-col justify-between p-2 relative overflow-hidden',
        gradientClass,
        'shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),inset_0_1px_2px_0_rgba(255,255,255,0.9)]',
        'transition-all duration-300 transform-gpu',
        'hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.3),inset_0_1px_2px_0_rgba(255,255,255,0.9)]',
        'hover:translate-y-[-4px] hover:rotate-1',
        'after:absolute after:inset-0 after:rounded-lg after:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] after:pointer-events-none',
        'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none',
        isHighlighted && 'ring-2 ring-primary transform scale-105',
        className
      )}
    >
      {/* Only show corner text for non-face cards */}
      {!isFaceCard && (
        <>
          {/* Top left corner */}
          <div
            className={cn(
              textColorClass,
              'flex items-center gap-0.5 text-left absolute top-1.5 left-2 z-10'
            )}
          >
            <span className='font-semibold text-2xl leading-none font-sans'>{rank}</span>
            <span className='text-xl leading-none'>{suitSymbol}</span>
          </div>

          {/* Bottom right corner (rotated 180 degrees) */}
          <div
            className={cn(
              textColorClass,
              'flex items-center gap-0.5 absolute bottom-1.5 right-2 rotate-180 z-10'
            )}
          >
            <span className='font-semibold text-sm leading-none font-sans'>{rank}</span>
            <span className='text-sm leading-none'>{suitSymbol}</span>
          </div>
        </>
      )}

      {/* Middle content - face card image or suit symbol */}
      {faceCardImage ? (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Image
            src={faceCardImage}
            alt={`${rank} of ${suit}`}
            width={500}
            height={726}
            className='max-w-[95%] max-h-[95%] object-contain'
            priority
          />
        </div>
      ) : (
        <div className={cn(textColorClass, 'text-center text-4xl self-center my-auto')}>
          {suitSymbol}
        </div>
      )}
    </div>
  )
}

function getSuitSymbol(suit: string): string {
  switch (suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
    default:
      return ''
  }
}

function getFaceCardImage(rank: string, suit: string): string | null {
  let rankName = ''
  switch (rank) {
    case 'J':
      rankName = 'jack'
      break
    case 'Q':
      rankName = 'queen'
      break
    case 'K':
      rankName = 'king'
      break
    default:
      return null
  }

  return `/images/cards/face/${rankName}_of_${suit}.png`
}
