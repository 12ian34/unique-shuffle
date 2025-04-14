import { Card, Deck, Suit, Rank, Color } from '@/types'

// Define the suits, ranks, and values
export const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
export const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const values = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
}

// Create a new deck of cards
export function createDeck(): Deck {
  const deck: Deck = []
  let index = 0

  for (const suit of suits) {
    for (const rank of ranks) {
      const color: Color = suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black'

      deck.push({
        suit,
        rank,
        value: values[rank],
        color,
        index: index++,
      })
    }
  }

  return deck
}

// Shuffle a deck of cards
export function shuffleDeck(deck: Deck): Deck {
  // Create a copy of the deck
  const shuffled = [...deck]

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Update indices after shuffling
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i] = {
      ...shuffled[i],
      index: i,
    }
  }

  return shuffled
}

// Get a card's display name
export function getCardDisplayName(card: Card): string {
  return `${card.rank} of ${card.suit}`
}

// Get a card's short name (e.g., "AS" for Ace of Spades)
export function getCardShortName(card: Card): string {
  const suitChar = card.suit.charAt(0).toUpperCase()
  return `${card.rank}${suitChar}`
}

// Check if cards are in sequence (consecutive ranks, any suit)
export function areCardsInSequence(cards: Card[]): boolean {
  // Sort cards by value
  const sorted = [...cards].sort((a, b) => a.value - b.value)

  // Check if each card is one value higher than the previous
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].value !== sorted[i - 1].value + 1) {
      return false
    }
  }

  return true
}

// Check if cards form a flush (same suit)
export function areCardsFlush(cards: Card[]): boolean {
  const suit = cards[0].suit
  return cards.every((card) => card.suit === suit)
}

// Check if cards alternate colors
export function doCardsAlternateColors(cards: Card[]): boolean {
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].color === cards[i - 1].color) {
      return false
    }
  }

  return true
}

// Find groups of cards with the same rank
export function findRankGroups(cards: Card[]): Record<string, Card[]> {
  const groups: Record<string, Card[]> = {}

  for (const card of cards) {
    if (!groups[card.rank]) {
      groups[card.rank] = []
    }
    groups[card.rank].push(card)
  }

  return groups
}

// Find pairs, three of a kind, four of a kind, etc.
export function findRankMatches(cards: Card[], count: number): Card[][] {
  const groups = findRankGroups(cards)
  const matches: Card[][] = []

  for (const rank in groups) {
    if (groups[rank].length >= count) {
      // For each group, find all possible combinations of 'count' cards
      const group = groups[rank]
      if (group.length === count) {
        matches.push(group)
      } else {
        // If there are more cards than needed, find all combinations
        // This is for situations like finding all possible pairs from 3 of a kind
        // For simplicity, we're just using the first 'count' cards
        matches.push(group.slice(0, count))
      }
    }
  }

  return matches
}

// Find straights (five cards in sequence, any suit)
export function findStraights(cards: Card[]): Card[][] {
  const result: Card[][] = []

  // Sort cards by value
  const sorted = [...cards].sort((a, b) => a.value - b.value)

  // Check for each possible starting position
  for (let i = 0; i <= sorted.length - 5; i++) {
    const potentialStraight = sorted.slice(i, i + 5)

    // Check if these 5 cards form a straight
    if (areCardsInSequence(potentialStraight)) {
      result.push(potentialStraight)
    }
  }

  return result
}

// Find poker hands in consecutive card sections (5 cards in a row)
export function findConsecutivePokerHands(deck: Deck): Record<string, Card[][]> {
  const result: Record<string, Card[][]> = {
    pair: [],
    twoPair: [],
    threeOfAKind: [],
    straight: [],
    flush: [],
    fullHouse: [],
    fourOfAKind: [],
    straightFlush: [],
    royalFlush: [],
  }

  // Check each 5-card consecutive section in the deck
  for (let i = 0; i <= deck.length - 5; i++) {
    const section = deck.slice(i, i + 5)

    // Find pairs in this section
    const rankGroups = findRankGroups(section)
    for (const rank in rankGroups) {
      if (rankGroups[rank].length === 2) {
        result.pair.push(rankGroups[rank])
      } else if (rankGroups[rank].length === 3) {
        result.threeOfAKind.push(rankGroups[rank])
      } else if (rankGroups[rank].length === 4) {
        result.fourOfAKind.push(rankGroups[rank])
      }
    }

    // Check for straight in this section
    if (areCardsInSequence(section)) {
      result.straight.push(section)

      // Check for flush
      if (areCardsFlush(section)) {
        result.straightFlush.push(section)

        // Check for royal flush (A, K, Q, J, 10 of same suit)
        const hasAce = section.some((card) => card.rank === 'A')
        const hasKing = section.some((card) => card.rank === 'K')
        const hasQueen = section.some((card) => card.rank === 'Q')
        const hasJack = section.some((card) => card.rank === 'J')
        const hasTen = section.some((card) => card.rank === '10')

        if (hasAce && hasKing && hasQueen && hasJack && hasTen) {
          result.royalFlush.push(section)
        }
      }
    } else if (areCardsFlush(section)) {
      result.flush.push(section)
    }

    // Check for full house (3 of one rank, 2 of another)
    const ranks = Object.keys(rankGroups)
    if (ranks.length === 2) {
      if (
        (rankGroups[ranks[0]].length === 3 && rankGroups[ranks[1]].length === 2) ||
        (rankGroups[ranks[0]].length === 2 && rankGroups[ranks[1]].length === 3)
      ) {
        result.fullHouse.push(section)
      }
    }
  }

  // Check for 4 consecutive cards with the same rank
  for (let i = 0; i <= deck.length - 4; i++) {
    const section = deck.slice(i, i + 4)
    if (section.every((card) => card.rank === section[0].rank)) {
      // All 4 cards have the same rank
      result.twoPair.push(section)
    }
  }

  return result
}

// Find poker hands (pairs, three of a kind, straight, flush, etc.)
export function findPokerHands(cards: Card[]): Record<string, Card[][]> {
  const result: Record<string, Card[][]> = {
    twoPair: [],
    threeOfAKind: [],
    straight: [],
    flush: [],
    fullHouse: [],
    fourOfAKind: [],
    straightFlush: [],
    royalFlush: [],
  }

  // Find pairs, three of a kind, four of a kind
  result.pair = findRankMatches(cards, 2)
  result.threeOfAKind = findRankMatches(cards, 3)
  result.fourOfAKind = findRankMatches(cards, 4)

  // Find straights and flushes
  result.straight = findStraights(cards)

  // This is a simplified implementation that doesn't check all possible hands
  // A full implementation would be more complex and check for all possible
  // combinations and poker hands

  return result
}
