import { Card } from '@/types'

// Utility functions for checking achievement conditions on a specific shuffle

/**
 * Checks if the shuffle contains 3 Aces in the first 5 cards
 */
export function hasTripleAcesFirst(cards: Card[]): boolean {
  if (cards.length < 5) return false

  const firstFiveCards = cards.slice(0, 5)
  let aceCount = 0

  for (const card of firstFiveCards) {
    if (card.value === 'A') {
      aceCount++
    }
  }

  return aceCount >= 3
}

/**
 * Checks if the shuffle contains 3 consecutive cards of the same suit in sequence
 * e.g., 5♠, 6♠, 7♠ (in that order)
 */
export function hasSequentialSameSuit(cards: Card[]): boolean {
  if (cards.length < 3) return false

  const valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

  for (let i = 0; i < cards.length - 2; i++) {
    const card1 = cards[i]
    const card2 = cards[i + 1]
    const card3 = cards[i + 2]

    // Check if all three cards have the same suit
    if (card1.suit === card2.suit && card2.suit === card3.suit) {
      // Check if they are in sequence
      const idx1 = valueOrder.indexOf(card1.value)
      const idx2 = valueOrder.indexOf(card2.value)
      const idx3 = valueOrder.indexOf(card3.value)

      if (idx2 === idx1 + 1 && idx3 === idx2 + 1) {
        return true
      }
    }
  }

  return false
}

/**
 * Checks if the shuffle contains 3 pairs of the same value
 * e.g., two 5s, two Js, two Qs (not necessarily consecutive)
 */
export function hasThreePairs(cards: Card[]): boolean {
  const valueCounts: Record<string, number> = {}

  for (const card of cards) {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1
  }

  let pairsCount = 0
  for (const value in valueCounts) {
    if (valueCounts[value] >= 2) {
      pairsCount++
    }
  }

  return pairsCount >= 3
}

/**
 * Checks if the shuffle has a perfect red/black alternating pattern
 */
export function hasSymmetricShuffle(cards: Card[]): boolean {
  if (cards.length < 4) return false // Need at least a few cards to make it interesting

  const redSuits = ['hearts', 'diamonds']
  let isCurrentRed = redSuits.includes(cards[0].suit.toLowerCase())

  for (let i = 1; i < cards.length; i++) {
    const isCardRed = redSuits.includes(cards[i].suit.toLowerCase())

    // If this card has the same color as the previous, pattern is broken
    if (isCardRed === isCurrentRed) {
      return false
    }

    isCurrentRed = isCardRed
  }

  return true
}

/**
 * Checks if all four suits are present in the first four cards
 */
export function hasRainbowShuffle(cards: Card[]): boolean {
  if (cards.length < 4) return false

  const suits = new Set<string>()

  for (let i = 0; i < 4; i++) {
    suits.add(cards[i].suit.toLowerCase())
  }

  return suits.size === 4
}

/**
 * Checks if the shuffle contains a royal flush (10, J, Q, K, A of the same suit) in sequential order
 */
export function hasRoyalFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false

  for (let i = 0; i <= cards.length - 5; i++) {
    const fiveCards = cards.slice(i, i + 5)
    const values = ['10', 'J', 'Q', 'K', 'A']

    // Check if all cards have the same suit
    const suit = fiveCards[0].suit
    if (!fiveCards.every((card) => card.suit === suit)) continue

    // Check if the values match a royal flush in sequence
    if (fiveCards.every((card, idx) => card.value === values[idx])) {
      return true
    }
  }

  return false
}

/**
 * Checks if all Queens appear in the first 10 cards
 */
export function hasAllQueensEarly(cards: Card[]): boolean {
  if (cards.length < 10) return false

  const firstTenCards = cards.slice(0, 10)
  const queenCount = firstTenCards.filter((card) => card.value === 'Q').length

  return queenCount === 4 // There are 4 queens in a deck
}

/**
 * Checks if 5 cards of the same suit appear in a row
 */
export function hasFiveSameSuitInRow(cards: Card[]): boolean {
  if (cards.length < 5) return false

  for (let i = 0; i <= cards.length - 5; i++) {
    const suit = cards[i].suit
    let sameCount = 1

    for (let j = i + 1; j < i + 5; j++) {
      if (cards[j].suit === suit) {
        sameCount++
      } else {
        break
      }
    }

    if (sameCount === 5) {
      return true
    }
  }

  return false
}

/**
 * Checks if the first 5 cards are all even-numbered (2, 4, 6, 8, 10)
 */
export function hasOnlyEvenCardsFirst(cards: Card[]): boolean {
  if (cards.length < 5) return false

  const evenValues = ['2', '4', '6', '8', '10']
  const firstFiveCards = cards.slice(0, 5)

  return firstFiveCards.every((card) => evenValues.includes(card.value))
}

/**
 * Checks if all 4 Aces appear in the shuffle
 */
export function hasAllAces(cards: Card[]): boolean {
  const aces = cards.filter((card) => card.value === 'A')
  return aces.length === 4
}

/**
 * Checks if the 7 of spades appears in the 7th position (index 6)
 */
export function has007Pattern(cards: Card[]): boolean {
  if (cards.length < 7) return false

  const seventhCard = cards[6]
  return seventhCard.value === '7' && seventhCard.suit.toLowerCase() === 'spades'
}

/**
 * Checks if the first two cards sum to 21 (Blackjack)
 */
export function hasBlackjack(cards: Card[]): boolean {
  if (cards.length < 2) return false

  const cardValues: Record<string, number> = {
    A: 11, // Ace is 11 for blackjack
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 10,
    Q: 10,
    K: 10,
  }

  const firstCard = cards[0]
  const secondCard = cards[1]

  const sum = cardValues[firstCard.value] + cardValues[secondCard.value]

  // Either an Ace + 10-value card, or exactly 21
  return (
    (firstCard.value === 'A' &&
      (secondCard.value === '10' ||
        secondCard.value === 'J' ||
        secondCard.value === 'Q' ||
        secondCard.value === 'K')) ||
    (secondCard.value === 'A' &&
      (firstCard.value === '10' ||
        firstCard.value === 'J' ||
        firstCard.value === 'Q' ||
        firstCard.value === 'K')) ||
    sum === 21
  )
}

/**
 * Checks if 5 face cards appear in a row
 */
export function hasFiveFaceCardsInRow(cards: Card[]): boolean {
  if (cards.length < 5) return false

  const faceCards = ['J', 'Q', 'K']

  for (let i = 0; i <= cards.length - 5; i++) {
    if (cards.slice(i, i + 5).every((card) => faceCards.includes(card.value))) {
      return true
    }
  }

  return false
}

/**
 * Checks if the cards are in perfect sequential order by suit and value
 * This is extremely unlikely but fun to check for
 */
export function hasPerfectSequentialOrder(cards: Card[]): boolean {
  if (cards.length < 13) return false // Need at least one full suit

  // Check if cards are arranged by suit and value
  const suits = ['clubs', 'diamonds', 'hearts', 'spades']
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  // Check for any 13-card sequence that follows perfect ordering
  for (let i = 0; i <= cards.length - 13; i++) {
    const suitIndex = suits.indexOf(cards[i].suit.toLowerCase())
    if (suitIndex === -1) continue

    const valueIndex = values.indexOf(cards[i].value)
    if (valueIndex === -1) continue

    let isPerfect = true

    // Check next 12 cards
    for (let j = 1; j < 13; j++) {
      const currentCard = cards[i + j]
      let expectedValueIndex = (valueIndex + j) % 13
      let expectedSuitIndex = suitIndex + Math.floor((valueIndex + j) / 13)

      if (expectedSuitIndex >= suits.length) {
        isPerfect = false
        break
      }

      if (
        currentCard.value !== values[expectedValueIndex] ||
        currentCard.suit.toLowerCase() !== suits[expectedSuitIndex]
      ) {
        isPerfect = false
        break
      }
    }

    if (isPerfect) return true
  }

  return false
}

// Function to check time-based achievements
export function checkTimeBasedAchievements(currentTime = new Date()): {
  isMidnight: boolean
  isMorning: boolean
  isWeekend: boolean
  isNightTime: boolean
  isTopOfHour: boolean
  isNewYearsDay: boolean
  isMonday: boolean
  isLeapDay: boolean
  isFridayThe13th: boolean
  isPalindromeDate: boolean
} {
  const hour = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  const day = currentTime.getDay() // 0 = Sunday, 6 = Saturday
  const date = currentTime.getDate()
  const month = currentTime.getMonth() + 1 // 1-12
  const year = currentTime.getFullYear()

  // Check various time conditions
  const isMidnight = hour >= 0 && hour < 3
  const isMorning = hour >= 5 && hour < 11
  const isWeekend = day === 0 || day === 6
  const isNightTime = hour >= 22 || hour < 4
  const isTopOfHour = minutes === 0
  const isNewYearsDay = month === 1 && date === 1
  const isMonday = day === 1
  const isLeapDay = month === 2 && date === 29
  const isFridayThe13th = day === 5 && date === 13

  // Check for palindrome date (MM/DD/YY format like 12/02/21)
  const yearLastTwo = year.toString().slice(-2)
  const monthStr = month.toString().padStart(2, '0')
  const dateStr = date.toString().padStart(2, '0')
  const dateFormatted = `${monthStr}${dateStr}${yearLastTwo}`
  const isPalindromeDate = dateFormatted === dateFormatted.split('').reverse().join('')

  return {
    isMidnight,
    isMorning,
    isWeekend,
    isNightTime,
    isTopOfHour,
    isNewYearsDay,
    isMonday,
    isLeapDay,
    isFridayThe13th,
    isPalindromeDate,
  }
}
