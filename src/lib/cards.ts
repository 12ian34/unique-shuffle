import { Card } from '@/types'

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const
export const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

// Cache for deck creation - no need to recreate the initial deck multiple times
let cachedDeck: Card[] | null = null

export function createDeck(): Card[] {
  // Return cached deck if available, creating a shallow copy to prevent mutation
  if (cachedDeck) {
    return [...cachedDeck]
  }

  // Create a new deck if no cached version exists
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value })
    }
  }

  // Cache the newly created deck and return a copy
  cachedDeck = deck
  return [...deck]
}

// Optimized Fisher-Yates shuffle algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  // Create a copy to avoid mutating the original
  const shuffled = [...deck]
  let remainingItems = shuffled.length

  // Only shuffle if there are items in the deck
  if (remainingItems <= 1) return shuffled

  // Use a faster loop with a temporary swap variable
  while (remainingItems) {
    // Pick a remaining element
    const randomIndex = Math.floor(Math.random() * remainingItems--)

    // Swap with the current element
    const tmp = shuffled[remainingItems]
    shuffled[remainingItems] = shuffled[randomIndex]
    shuffled[randomIndex] = tmp
  }

  return shuffled
}

// Optimized card string format
export function getCardString(card: Card): string {
  return `${card.value}${card.suit[0].toUpperCase()}`
}

// Optimized image path retrieval with memoization
const cardImagePathCache = new Map<string, string>()

export function getCardImagePath(card: Card): string {
  const cardKey = `${card.value}-${card.suit}`

  if (!cardImagePathCache.has(cardKey)) {
    const path = `/cards/${getCardString(card)}.svg`
    cardImagePathCache.set(cardKey, path)
    return path
  }

  return cardImagePathCache.get(cardKey)!
}

// Optimized card key generation
export function getCardKey(card: Card): string {
  return `${card.value}${card.suit}`
}

// Optimized card statistics calculator using Map for better performance
export function getCardStats(shuffles: Card[][]): Record<string, number> {
  const statsMap = new Map<string, number>()

  for (const shuffle of shuffles) {
    for (const card of shuffle) {
      const key = getCardKey(card)
      statsMap.set(key, (statsMap.get(key) || 0) + 1)
    }
  }

  // Convert Map to Record for API compatibility
  return Object.fromEntries(statsMap)
}
