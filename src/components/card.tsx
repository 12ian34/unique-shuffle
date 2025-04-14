'use client'

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

  return (
    <div
      className={cn(
        'aspect-[2/3] rounded-md border bg-white flex flex-col justify-between p-2 shadow-sm transition-transform hover:scale-105',
        isHighlighted && 'ring-2 ring-primary transform scale-105',
        className
      )}
    >
      <div className={cn(textColorClass, 'text-left font-medium text-lg')}>{rank}</div>
      <div className={cn(textColorClass, 'text-center text-2xl font-serif')}>{suitSymbol}</div>
      <div className={cn(textColorClass, 'text-right font-medium text-lg rotate-180')}>{rank}</div>
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
