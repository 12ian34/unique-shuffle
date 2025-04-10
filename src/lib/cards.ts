import { Card } from '@/types'

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function getCardString(card: Card): string {
  return `${card.value}${card.suit[0].toUpperCase()}`
}

export function getCardImagePath(card: Card): string {
  return `/cards/${getCardString(card)}.svg`
}

export function getCardKey(card: Card): string {
  return `${card.value}${card.suit}`
}

export function getCardStats(shuffles: Card[][]): Record<string, number> {
  const stats: Record<string, number> = {}
  
  for (const shuffle of shuffles) {
    for (const card of shuffle) {
      const key = getCardKey(card)
      stats[key] = (stats[key] || 0) + 1
    }
  }
  
  return stats
} 