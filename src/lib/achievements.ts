import { Achievement, Deck, Pattern, Suit, Card } from '@/types'
import {
  findPokerHands,
  areCardsFlush,
  doCardsAlternateColors,
  findConsecutivePokerHands,
  areCardsInSequence,
} from './cards'

// Import the ranks from cards.ts
import { ranks } from './cards'

// Define the available achievements
export const achievements: Achievement[] = [
  // Pattern-based achievements
  {
    id: 'royal_flush',
    name: 'Royal Flush',
    description: 'Find 5 consecutive cards forming a royal flush',
    type: 'pattern',
    criteria: { patternId: 'royal_flush' },
  },
  {
    id: 'straight_flush',
    name: 'Straight Flush',
    description: 'Find 5 consecutive cards forming a straight flush',
    type: 'pattern',
    criteria: { patternId: 'straight_flush' },
  },
  {
    id: 'four_of_a_kind',
    name: 'Four of a Kind',
    description: 'Find 4 consecutive cards of the same rank',
    type: 'pattern',
    criteria: { patternId: 'four_of_a_kind' },
  },
  {
    id: 'full_house',
    name: 'Full House',
    description: 'Find a full house within 5 consecutive cards',
    type: 'pattern',
    criteria: { patternId: 'full_house' },
  },
  {
    id: 'flush',
    name: 'Flush',
    description: 'Find 5 consecutive cards of the same suit',
    type: 'pattern',
    criteria: { patternId: 'flush' },
  },
  {
    id: 'straight',
    name: 'Straight',
    description: 'Find 5 consecutive cards in sequence',
    type: 'pattern',
    criteria: { patternId: 'straight' },
  },
  {
    id: 'three_of_a_kind',
    name: 'Three of a Kind',
    description: 'Find 3 consecutive cards of the same rank',
    type: 'pattern',
    criteria: { patternId: 'three_of_a_kind' },
  },
  {
    id: 'two_pair',
    name: 'Two Pair',
    description: 'Find two pairs in four consecutive cards (e.g., 5-5-9-9)',
    type: 'pattern',
    criteria: { patternId: 'two_pair' },
  },
  {
    id: 'alternating_colors',
    name: 'Alternating Colors',
    description: 'Shuffle with perfectly alternating colors',
    type: 'pattern',
    criteria: { patternId: 'alternating_colors' },
  },
  {
    id: 'all_red',
    name: 'Seeing Red',
    description: 'First 13 cards are all red',
    type: 'pattern',
    criteria: { patternId: 'all_red' },
  },
  {
    id: 'all_black',
    name: 'Back in Black',
    description: 'First 13 cards are all black',
    type: 'pattern',
    criteria: { patternId: 'all_black' },
  },
  {
    id: 'four_aces',
    name: 'Ace Collector',
    description: 'All four aces in a row',
    type: 'pattern',
    criteria: { patternId: 'four_aces' },
  },
  // Creative new achievements
  {
    id: 'royal_family',
    name: 'Royal Family',
    description: 'Find 4 consecutive face cards (J, Q, K) in a row',
    type: 'pattern',
    criteria: { patternId: 'royal_family' },
  },
  {
    id: 'lucky_thirteen',
    name: 'Lucky Thirteen',
    description: 'Card #13 in your shuffle is an Ace',
    type: 'pattern',
    criteria: { patternId: 'lucky_thirteen' },
  },
  {
    id: 'perfect_suit',
    name: 'Perfect Suit',
    description: 'Find at least 6 cards of the same suit in a row',
    type: 'pattern',
    criteria: { patternId: 'perfect_suit' },
  },
  {
    id: 'stairway_to_heaven',
    name: 'Stairway to Heaven',
    description: 'Find 7 consecutive cards in ascending order',
    type: 'pattern',
    criteria: { patternId: 'stairway_to_heaven' },
  },
  {
    id: 'highway_to_hell',
    name: 'Highway to Hell',
    description: 'Find 7 consecutive cards in descending order',
    type: 'pattern',
    criteria: { patternId: 'highway_to_hell' },
  },
  {
    id: 'prime_position',
    name: 'Prime Position',
    description: 'Cards at positions 2, 3, 5, 7, 11, and 13 are of the same color',
    type: 'pattern',
    criteria: { patternId: 'prime_position' },
  },
  {
    id: 'palindrome',
    name: 'Palindrome',
    description:
      'Find 6 consecutive cards with ranks that read the same forward and backward (e.g., 2-3-4-4-3-2)',
    type: 'pattern',
    criteria: { patternId: 'palindrome' },
  },
  {
    id: 'four_corners',
    name: 'Four Corners',
    description: 'All four corners of the deck (1st, 13th, 40th, and 52nd cards) are the same suit',
    type: 'pattern',
    criteria: { patternId: 'four_corners' },
  },
  {
    id: 'unlucky_shuffle',
    name: 'Unlucky Shuffle',
    description: 'Position 13 contains a spade and position 13 is a K',
    type: 'pattern',
    criteria: { patternId: 'unlucky_shuffle' },
  },
  {
    id: 'the_sandwich',
    name: 'The Sandwich',
    description:
      'Find 3 consecutive cards where the middle card is of a different suit than the outer two (which have the same suit)',
    type: 'pattern',
    criteria: { patternId: 'the_sandwich' },
  },

  // Count-based achievements
  {
    id: 'first_shuffle',
    name: 'First Shuffle',
    description: 'Complete your first shuffle',
    type: 'count',
    criteria: { shuffleCount: 1 },
  },
  {
    id: 'ten_shuffles',
    name: 'Shuffle Novice',
    description: 'Complete 10 shuffles',
    type: 'count',
    criteria: { shuffleCount: 10 },
  },
  {
    id: 'fifty_shuffles',
    name: 'Shuffle Enthusiast',
    description: 'Complete 50 shuffles',
    type: 'count',
    criteria: { shuffleCount: 50 },
  },
  {
    id: 'hundred_shuffles',
    name: 'Shuffle Master',
    description: 'Complete 100 shuffles',
    type: 'count',
    criteria: { shuffleCount: 100 },
  },
  {
    id: 'five_hundred_shuffles',
    name: 'Shuffle Addict',
    description: 'Complete 500 shuffles',
    type: 'count',
    criteria: { shuffleCount: 500 },
  },

  // Time-based achievements
  {
    id: 'midnight_shuffle',
    name: 'Night Owl',
    description: 'Shuffle between midnight and 4 AM',
    type: 'time',
    criteria: {
      timeOfDay: {
        start: '00:00',
        end: '04:00',
      },
    },
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Shuffle on a weekend',
    type: 'time',
    criteria: {
      dayOfWeek: [0, 6], // Sunday (0) and Saturday (6)
    },
  },

  // New non-poker achievements
  {
    id: 'fibonacci_sequence',
    name: 'Fibonacci Sequence',
    description: 'Find 5 consecutive cards with values following a Fibonacci-like pattern',
    type: 'pattern',
    criteria: { patternId: 'fibonacci_sequence' },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Find 4 consecutive cards with all 4 suits in alternating colors',
    type: 'pattern',
    criteria: { patternId: 'rainbow' },
  },
  {
    id: 'double_rainbow',
    name: 'Double Rainbow',
    description:
      'Find 8 consecutive cards where 4 suits appear in order and repeat in the same order',
    type: 'pattern',
    criteria: { patternId: 'double_rainbow' },
  },
  {
    id: 'prime_values',
    name: 'Prime Numbers',
    description: 'Find 5 consecutive cards with prime values (2, 3, 5, 7, 11, 13)',
    type: 'pattern',
    criteria: { patternId: 'prime_values' },
  },
  {
    id: 'sum_thirteen',
    name: 'Lucky Sum',
    description: 'Find 2 consecutive cards whose blackjack values sum to 13 (J,Q,K=10, A=1 or 11)',
    type: 'pattern',
    criteria: { patternId: 'sum_thirteen' },
  },
  {
    id: 'color_gradient',
    name: 'Color Gradient',
    description: 'Find at least 8 consecutive cards of the same color',
    type: 'pattern',
    criteria: { patternId: 'color_gradient' },
  },
  {
    id: 'perfect_balance',
    name: 'Perfect Balance',
    description:
      'Find a section of 10 cards with exactly 5 red and 5 black, excluding face cards and aces',
    type: 'pattern',
    criteria: { patternId: 'perfect_balance' },
  },
  {
    id: 'sequential_trio',
    name: 'Sequential Trio',
    description: 'Find 3 consecutive cards of the same suit in sequential order',
    type: 'pattern',
    criteria: { patternId: 'sequential_trio' },
  },
  {
    id: 'even_odd_pattern',
    name: 'Even Odd Pattern',
    description: 'Find 6 consecutive cards alternating between even and odd values',
    type: 'pattern',
    criteria: { patternId: 'even_odd_pattern' },
  },

  // Ultra rare achievements
  {
    id: 'perfect_order',
    name: 'Perfect Order',
    description: 'Find 13 cards of the same suit in perfect numerical order',
    type: 'pattern',
    criteria: { patternId: 'perfect_order' },
  },
  {
    id: 'quad_sequence',
    name: 'Quad Sequence',
    description:
      'Find all 4 cards of the same rank, followed immediately by all 4 cards of the next rank',
    type: 'pattern',
    criteria: { patternId: 'quad_sequence' },
  },
  {
    id: 'royal_procession',
    name: 'Royal Procession',
    description: 'Find all 12 face cards (J, Q, K) in consecutive positions',
    type: 'pattern',
    criteria: { patternId: 'royal_procession' },
  },
  {
    id: 'mirror_shuffle',
    name: 'Mirror Shuffle',
    description: 'First 26 cards mirror the last 26 cards in reverse order (by rank)',
    type: 'pattern',
    criteria: { patternId: 'mirror_shuffle' },
  },
  {
    id: 'perfect_bridge',
    name: 'Perfect Bridge',
    description:
      'Cards alternate perfectly between red and black for at least 26 consecutive positions',
    type: 'pattern',
    criteria: { patternId: 'perfect_bridge' },
  },
  {
    id: 'symmetrical_suits',
    name: 'Symmetrical Suits',
    description: 'Find a sequence of at least 12 cards where the suit pattern is symmetrical',
    type: 'pattern',
    criteria: { patternId: 'symmetrical_suits' },
  },
  {
    id: 'consecutive_flush_quads',
    name: 'Consecutive Flush Quads',
    description:
      'All 4 hearts, followed by all 4 diamonds, followed by all 4 clubs, followed by all 4 spades of the same rank',
    type: 'pattern',
    criteria: { patternId: 'consecutive_flush_quads' },
  },
  {
    id: 'consecutive_runs',
    name: 'Consecutive Runs',
    description:
      'Find 3 consecutive straights (15 cards in sequence where each group of 5 forms a straight)',
    type: 'pattern',
    criteria: { patternId: 'consecutive_runs' },
  },
  {
    id: 'suit_segregation',
    name: 'Suit Segregation',
    description: 'All 13 cards of one suit, followed by all 13 of another suit',
    type: 'pattern',
    criteria: { patternId: 'suit_segregation' },
  },
]

// Find patterns in a deck
export function findPatterns(deck: Deck): Pattern[] {
  const patterns: Pattern[] = []

  // Find poker hands in consecutive sections
  const pokerHands = findConsecutivePokerHands(deck)

  // Check for three of a kind in consecutive sections - replacing this logic
  // to only detect three cards of the same rank in directly consecutive positions
  for (let i = 0; i <= deck.length - 3; i++) {
    const section = deck.slice(i, i + 3)

    // Check if all three cards have the same rank
    if (section[0].rank === section[1].rank && section[1].rank === section[2].rank) {
      patterns.push({
        id: 'three_of_a_kind',
        name: 'Three of a Kind',
        description: `Three ${section[0].rank}s in consecutive positions ${i + 1} to ${i + 3}`,
        indices: section.map((c) => c.index),
        type: 'three',
      })
    }
  }

  // Check for four of a kind in consecutive positions
  for (let i = 0; i <= deck.length - 4; i++) {
    const section = deck.slice(i, i + 4)

    // Check if all four cards have the same rank
    if (
      section[0].rank === section[1].rank &&
      section[1].rank === section[2].rank &&
      section[2].rank === section[3].rank
    ) {
      patterns.push({
        id: 'four_of_a_kind',
        name: 'Four of a Kind',
        description: `Four ${section[0].rank}s in consecutive positions ${i + 1} to ${i + 4}`,
        indices: section.map((c) => c.index),
        type: 'four',
      })
    }
  }

  // Check for straights in consecutive sections
  if (pokerHands.straight.length > 0) {
    for (const straight of pokerHands.straight) {
      patterns.push({
        id: 'straight',
        name: 'Straight',
        description: `Straight from ${straight[0].rank} to ${
          straight[4].rank
        } at positions ${straight.map((c) => c.index + 1).join(', ')}`,
        indices: straight.map((c) => c.index),
        type: 'straight',
      })
    }
  }

  // Check for flushes in consecutive sections
  if (pokerHands.flush.length > 0) {
    for (const flush of pokerHands.flush) {
      patterns.push({
        id: 'flush',
        name: 'Flush',
        description: `Flush of ${flush[0].suit} at positions ${flush
          .map((c) => c.index + 1)
          .join(', ')}`,
        indices: flush.map((c) => c.index),
        type: 'flush',
      })
    }
  }

  // Check for full houses in consecutive sections
  if (pokerHands.fullHouse.length > 0) {
    for (const fullHouse of pokerHands.fullHouse) {
      patterns.push({
        id: 'full_house',
        name: 'Full House',
        description: `Full House at positions ${fullHouse.map((c) => c.index + 1).join(', ')}`,
        indices: fullHouse.map((c) => c.index),
        type: 'full_house',
      })
    }
  }

  // Check for straight flushes in consecutive sections
  if (pokerHands.straightFlush.length > 0) {
    for (const straightFlush of pokerHands.straightFlush) {
      patterns.push({
        id: 'straight_flush',
        name: 'Straight Flush',
        description: `Straight Flush at positions ${straightFlush
          .map((c) => c.index + 1)
          .join(', ')}`,
        indices: straightFlush.map((c) => c.index),
        type: 'straight_flush',
      })
    }
  }

  // Check for two pair in 4 consecutive cards (e.g., 5-5-9-9)
  for (let i = 0; i <= deck.length - 4; i++) {
    const section = deck.slice(i, i + 4)
    const ranks = section.map((card) => card.rank)

    // Need exactly 2 distinct ranks
    const uniqueRanks = new Set(ranks)
    if (uniqueRanks.size === 2) {
      // And each rank must appear exactly twice
      const rankCounts: Record<string, number> = {}
      ranks.forEach((rank) => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1
      })

      const allRanksAppearTwice = Object.values(rankCounts).every((count) => count === 2)

      if (allRanksAppearTwice) {
        patterns.push({
          id: 'two_pair',
          name: 'Two Pair',
          description: `Two pairs in consecutive positions ${i + 1} to ${i + 4}`,
          indices: section.map((c) => c.index),
          type: 'two_pair',
        })
      }
    }
  }

  // Check for four aces in a row
  const aces = deck.filter((card) => card.rank === 'A')
  if (aces.length === 4) {
    // Check if they're consecutive in the shuffle
    const acesIndices = aces.map((a) => a.index).sort((a, b) => a - b)
    if (acesIndices[3] - acesIndices[0] === 3) {
      patterns.push({
        id: 'four_aces',
        name: 'Four Aces in a Row',
        description: 'All four aces in consecutive positions',
        indices: acesIndices,
        type: 'special',
      })
    }
  }

  // Check for royal family (J, Q, K of any suit in a row)
  const faceCards = deck.filter((card) => ['J', 'Q', 'K'].includes(card.rank))
  for (let i = 0; i <= deck.length - 4; i++) {
    const section = deck.slice(i, i + 4)
    if (section.every((card) => ['J', 'Q', 'K'].includes(card.rank))) {
      patterns.push({
        id: 'royal_family',
        name: 'Royal Family',
        description: '4 consecutive face cards in a row',
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check if card at position 13 is an Ace
  if (deck[12] && deck[12].rank === 'A') {
    patterns.push({
      id: 'lucky_thirteen',
      name: 'Lucky Thirteen',
      description: 'Card #13 is an Ace',
      indices: [12],
      type: 'special',
    })
  }

  // Check for 6 or more cards of the same suit in a row
  for (let i = 0; i <= deck.length - 6; i++) {
    const section = deck.slice(i, i + 6)
    if (areCardsFlush(section)) {
      patterns.push({
        id: 'perfect_suit',
        name: 'Perfect Suit',
        description: `6 ${section[0].suit} in a row from positions ${i + 1} to ${i + 6}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for 7 cards in ascending order
  for (let i = 0; i <= deck.length - 7; i++) {
    const section = deck.slice(i, i + 7)
    const sortedValues = [...section].sort((a, b) => a.value - b.value)
    if (
      section.every((card, index) => card.value === sortedValues[index].value) &&
      section[6].value - section[0].value === 6
    ) {
      patterns.push({
        id: 'stairway_to_heaven',
        name: 'Stairway to Heaven',
        description: `7 cards in ascending order from positions ${i + 1} to ${i + 7}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for 7 cards in descending order
  for (let i = 0; i <= deck.length - 7; i++) {
    const section = deck.slice(i, i + 7)
    const sortedValues = [...section].sort((a, b) => b.value - a.value)
    if (
      section.every((card, index) => card.value === sortedValues[index].value) &&
      section[0].value - section[6].value === 6
    ) {
      patterns.push({
        id: 'highway_to_hell',
        name: 'Highway to Hell',
        description: `7 cards in descending order from positions ${i + 1} to ${i + 7}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for cards at prime positions (2, 3, 5, 7, 11, 13) having the same color
  const primePositions = [1, 2, 4, 6, 10, 12] // 0-indexed positions for cards at positions 2, 3, 5, 7, 11, 13
  if (
    primePositions.every((pos) => deck[pos]) &&
    primePositions.every((pos) => deck[pos].color === deck[primePositions[0]].color)
  ) {
    patterns.push({
      id: 'prime_position',
      name: 'Prime Position',
      description: `Cards at positions 2, 3, 5, 7, 11, and 13 are all ${
        deck[primePositions[0]].color
      }`,
      indices: primePositions,
      type: 'special',
    })
  }

  // Check for palindrome in 6 consecutive cards
  for (let i = 0; i <= deck.length - 6; i++) {
    const section = deck.slice(i, i + 6)
    const ranks = section.map((card) => card.rank)

    // Check if it's a palindrome
    if (ranks[0] === ranks[5] && ranks[1] === ranks[4] && ranks[2] === ranks[3]) {
      patterns.push({
        id: 'palindrome',
        name: 'Palindrome',
        description: `Palindrome pattern at positions ${i + 1} to ${i + 6}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check if the four "corners" of the deck have the same suit
  if (
    deck[0] &&
    deck[12] &&
    deck[39] &&
    deck[51] &&
    deck[0].suit === deck[12].suit &&
    deck[12].suit === deck[39].suit &&
    deck[39].suit === deck[51].suit
  ) {
    patterns.push({
      id: 'four_corners',
      name: 'Four Corners',
      description: `All four corners (1st, 13th, 40th, and 52nd cards) are ${deck[0].suit}`,
      indices: [0, 12, 39, 51],
      type: 'special',
    })
  }

  // Check for unlucky shuffle (position 13 is K of spades)
  if (deck[12] && deck[12].rank === 'K' && deck[12].suit === 'spades') {
    patterns.push({
      id: 'unlucky_shuffle',
      name: 'Unlucky Shuffle',
      description: 'The 13th card is the King of Spades',
      indices: [12],
      type: 'special',
    })
  }

  // Check for alternating colors
  if (doCardsAlternateColors(deck)) {
    patterns.push({
      id: 'alternating_colors',
      name: 'Alternating Colors',
      description: 'The entire deck alternates between red and black cards',
      type: 'special',
    })
  }

  // Check for all red/black in first 13 cards
  const first13 = deck.slice(0, 13)
  const allRed = first13.every((card) => card.color === 'red')
  const allBlack = first13.every((card) => card.color === 'black')

  if (allRed) {
    patterns.push({
      id: 'all_red',
      name: 'Seeing Red',
      description: 'First 13 cards are all red',
      indices: first13.map((c) => c.index),
      type: 'special',
    })
  }

  if (allBlack) {
    patterns.push({
      id: 'all_black',
      name: 'Back in Black',
      description: 'First 13 cards are all black',
      indices: first13.map((c) => c.index),
      type: 'special',
    })
  }

  // Check for Rainbow (4 consecutive cards with all 4 suits in alternating colors)
  for (let i = 0; i <= deck.length - 4; i++) {
    const section = deck.slice(i, i + 4)
    const suits = new Set(section.map((card) => card.suit))

    // Need all 4 suits
    if (suits.size === 4) {
      // Also need alternating colors
      let hasAlternatingColors = true
      for (let j = 1; j < section.length; j++) {
        if (section[j].color === section[j - 1].color) {
          hasAlternatingColors = false
          break
        }
      }

      if (hasAlternatingColors) {
        patterns.push({
          id: 'rainbow',
          name: 'Rainbow',
          description: `All 4 suits with alternating colors at positions ${i + 1} to ${i + 4}`,
          indices: section.map((c) => c.index),
          type: 'special',
        })
        break
      }
    }
  }

  // Check for Double Rainbow (4 suits in order followed by the same 4 suits in the same order)
  for (let i = 0; i <= deck.length - 8; i++) {
    const firstSection = deck.slice(i, i + 4)
    const secondSection = deck.slice(i + 4, i + 8)

    // First check if both sections contain all 4 suits
    const firstSuits = new Set(firstSection.map((card) => card.suit))
    const secondSuits = new Set(secondSection.map((card) => card.suit))

    if (firstSuits.size === 4 && secondSuits.size === 4) {
      // Check if the suits appear in the same order
      const sameOrder = firstSection.every((card, index) => card.suit === secondSection[index].suit)

      if (sameOrder) {
        patterns.push({
          id: 'double_rainbow',
          name: 'Double Rainbow',
          description: `Four suits in the same order repeated at positions ${i + 1} to ${i + 8}`,
          indices: [...firstSection, ...secondSection].map((c) => c.index),
          type: 'special',
        })
        break
      }
    }
  }

  // Check for Fibonacci-like sequence (each value is approximately the sum of the two preceding)
  for (let i = 0; i <= deck.length - 5; i++) {
    const section = deck.slice(i, i + 5)
    // Sort by position, not by value
    const sortedByPosition = [...section].sort((a, b) => a.index - b.index)
    const values = sortedByPosition.map((card) => card.value)

    // Check if each value is approximately the sum of the two preceding values
    // Allow for "wrap around" at high values (e.g., K+Q can be seen as 13+12=25, which wraps to 12)
    let isFibonacciLike = true
    for (let j = 2; j < values.length; j++) {
      const sum = (values[j - 1] + values[j - 2]) % 13
      const target = values[j] === 13 ? 13 : values[j] % 13
      if (sum !== target && sum !== target + 1 && sum !== target - 1) {
        isFibonacciLike = false
        break
      }
    }

    if (isFibonacciLike) {
      patterns.push({
        id: 'fibonacci_sequence',
        name: 'Fibonacci Sequence',
        description: `Fibonacci-like sequence at positions ${i + 1} to ${i + 5}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for Prime Values (cards with values 2, 3, 5, 7, 11, 13/K)
  const primeValues = [2, 3, 5, 7, 11, 13]
  for (let i = 0; i <= deck.length - 5; i++) {
    const section = deck.slice(i, i + 5)
    if (section.every((card) => primeValues.includes(card.value))) {
      patterns.push({
        id: 'prime_values',
        name: 'Prime Numbers',
        description: `5 cards with prime values at positions ${i + 1} to ${i + 5}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for Lucky Sum with blackjack values (2 consecutive cards summing to 13)
  for (let i = 0; i < deck.length - 1; i++) {
    const card1 = deck[i]
    const card2 = deck[i + 1]

    // Get blackjack values
    const getBlackjackValue = (card: Card) => {
      if (['J', 'Q', 'K'].includes(card.rank)) return 10
      if (card.rank === 'A') {
        // For Ace, try both 1 and 11
        return card2.rank === 'A' ? 1 : 11 // If both cards are Aces, use 1+1; otherwise 11+value
      }
      return card.value
    }

    const value1 = getBlackjackValue(card1)
    const value2 = getBlackjackValue(card2)

    if (value1 + value2 === 13) {
      patterns.push({
        id: 'sum_thirteen',
        name: 'Lucky Sum',
        description: `Cards at positions ${i + 1} and ${i + 2} sum to 13 using blackjack values`,
        indices: [card1.index, card2.index],
        type: 'special',
      })
      break
    }
  }

  // Check for Color Gradient (8 or more consecutive cards of the same color)
  for (let i = 0; i <= deck.length - 8; i++) {
    const section = deck.slice(i, i + 8)
    if (section.every((card) => card.color === section[0].color)) {
      patterns.push({
        id: 'color_gradient',
        name: 'Color Gradient',
        description: `8 ${section[0].color} cards in a row from positions ${i + 1} to ${i + 8}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for Perfect Balance (10 cards with exactly 5 red and 5 black, excluding face cards and aces)
  for (let i = 0; i <= deck.length - 10; i++) {
    const section = deck.slice(i, i + 10)

    // Filter out face cards and aces
    const filteredSection = section.filter((card) => !['J', 'Q', 'K', 'A'].includes(card.rank))

    // Skip if we don't have enough cards after filtering
    if (filteredSection.length < 10) continue

    // Take only the first 10 cards after filtering
    const consideredCards = filteredSection.slice(0, 10)

    const redCount = consideredCards.filter((card) => card.color === 'red').length

    if (redCount === 5) {
      patterns.push({
        id: 'perfect_balance',
        name: 'Perfect Balance',
        description: `Perfect balance of red and black (excluding J,Q,K,A) starting at position ${
          i + 1
        }`,
        indices: consideredCards.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for Sequential Trio (3 consecutive cards of the same suit in sequential order)
  for (let i = 0; i <= deck.length - 3; i++) {
    const section = deck.slice(i, i + 3)

    if (
      areCardsFlush(section) &&
      section[1].value === section[0].value + 1 &&
      section[2].value === section[1].value + 1
    ) {
      patterns.push({
        id: 'sequential_trio',
        name: 'Sequential Trio',
        description: `3 sequential ${section[0].suit} cards at positions ${i + 1} to ${i + 3}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for Even Odd Pattern (6 consecutive cards alternating between even and odd values)
  for (let i = 0; i <= deck.length - 6; i++) {
    const section = deck.slice(i, i + 6)
    let isValidPattern = true

    for (let j = 1; j < section.length; j++) {
      const isCurrentEven = section[j].value % 2 === 0
      const isPreviousEven = section[j - 1].value % 2 === 0

      if (isCurrentEven === isPreviousEven) {
        isValidPattern = false
        break
      }
    }

    if (isValidPattern) {
      patterns.push({
        id: 'even_odd_pattern',
        name: 'Even Odd Pattern',
        description: `Alternating even/odd values at positions ${i + 1} to ${i + 6}`,
        indices: section.map((c) => c.index),
        type: 'special',
      })
      break
    }
  }

  // Check for Perfect Order (13 cards of the same suit in perfect numerical order)
  for (let i = 0; i <= deck.length - 13; i++) {
    const section = deck.slice(i, i + 13)

    if (areCardsFlush(section)) {
      // Check if the cards are in perfect numerical order
      const sortedValues = [...section].sort((a, b) => a.value - b.value)
      const isInOrder = section.every((card, idx) => card.value === sortedValues[idx].value)

      if (isInOrder && section[12].value - section[0].value === 12) {
        patterns.push({
          id: 'perfect_order',
          name: 'Perfect Order',
          description: `All 13 ${section[0].suit} cards in perfect order from positions ${
            i + 1
          } to ${i + 13}`,
          indices: section.map((c) => c.index),
          type: 'legendary',
        })
        break
      }
    }
  }

  // Check for Quad Sequence (all 4 cards of one rank followed by all 4 of the next rank)
  for (let i = 0; i <= deck.length - 8; i++) {
    const section = deck.slice(i, i + 8)
    const firstFour = section.slice(0, 4)
    const secondFour = section.slice(4, 8)

    const firstRank = firstFour[0].rank
    const secondRank = secondFour[0].rank

    // Check if all cards in each group have the same rank
    const firstQuad = firstFour.every((card) => card.rank === firstRank)
    const secondQuad = secondFour.every((card) => card.rank === secondRank)

    // Check if the second rank is the next in sequence
    const isNextRank = ranks.indexOf(secondRank) === (ranks.indexOf(firstRank) + 1) % 13

    if (firstQuad && secondQuad && isNextRank) {
      patterns.push({
        id: 'quad_sequence',
        name: 'Quad Sequence',
        description: `All four ${firstRank}s followed by all four ${secondRank}s from positions ${
          i + 1
        } to ${i + 8}`,
        indices: section.map((c) => c.index),
        type: 'legendary',
      })
      break
    }
  }

  // Check for Royal Procession (all 12 face cards in consecutive positions)
  for (let i = 0; i <= deck.length - 12; i++) {
    const section = deck.slice(i, i + 12)

    // Check if all cards are face cards (J, Q, K)
    if (section.every((card) => ['J', 'Q', 'K'].includes(card.rank))) {
      const jackCount = section.filter((card) => card.rank === 'J').length
      const queenCount = section.filter((card) => card.rank === 'Q').length
      const kingCount = section.filter((card) => card.rank === 'K').length

      // Verify we have all 4 of each face card
      if (jackCount === 4 && queenCount === 4 && kingCount === 4) {
        patterns.push({
          id: 'royal_procession',
          name: 'Royal Procession',
          description: `All 12 face cards in consecutive positions from ${i + 1} to ${i + 12}`,
          indices: section.map((c) => c.index),
          type: 'legendary',
        })
        break
      }
    }
  }

  // Check for Mirror Shuffle (first 26 cards mirror the last 26 cards in rank)
  if (deck.length === 52) {
    const firstHalf = deck.slice(0, 26)
    const secondHalf = deck.slice(26, 52).reverse()

    let isMirrored = true
    for (let i = 0; i < 26; i++) {
      if (firstHalf[i].rank !== secondHalf[i].rank) {
        isMirrored = false
        break
      }
    }

    if (isMirrored) {
      patterns.push({
        id: 'mirror_shuffle',
        name: 'Mirror Shuffle',
        description: 'The first 26 cards mirror the last 26 cards in reverse order by rank',
        indices: deck.map((c) => c.index),
        type: 'legendary',
      })
    }
  }

  // Check for Perfect Bridge (at least 26 consecutive cards alternating red and black)
  for (let i = 0; i <= deck.length - 26; i++) {
    const section = deck.slice(i, i + 26)

    let isPerfectBridge = true
    for (let j = 1; j < 26; j++) {
      if (section[j].color === section[j - 1].color) {
        isPerfectBridge = false
        break
      }
    }

    if (isPerfectBridge) {
      patterns.push({
        id: 'perfect_bridge',
        name: 'Perfect Bridge',
        description: `Perfect alternating colors for 26 cards from positions ${i + 1} to ${i + 26}`,
        indices: section.map((c) => c.index),
        type: 'legendary',
      })
      break
    }
  }

  // Check for Symmetrical Suits (at least 12 cards with symmetrical suit pattern)
  for (let i = 0; i <= deck.length - 12; i++) {
    const section = deck.slice(i, i + 12)
    const suits = section.map((card) => card.suit)

    let isSymmetrical = true
    for (let j = 0; j < 6; j++) {
      if (suits[j] !== suits[11 - j]) {
        isSymmetrical = false
        break
      }
    }

    if (isSymmetrical) {
      patterns.push({
        id: 'symmetrical_suits',
        name: 'Symmetrical Suits',
        description: `Symmetrical suit pattern for 12 cards from positions ${i + 1} to ${i + 12}`,
        indices: section.map((c) => c.index),
        type: 'legendary',
      })
      break
    }
  }

  // Check for Consecutive Flush Quads (4 hearts, 4 diamonds, 4 clubs, 4 spades of same rank)
  for (let i = 0; i <= deck.length - 16; i++) {
    const section = deck.slice(i, i + 16)

    // Group the cards by suit
    const suitGroups: Record<Suit, Card[]> = {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: [],
    }

    section.forEach((card) => {
      suitGroups[card.suit].push(card)
    })

    // Check if each suit has exactly 4 cards
    if (
      suitGroups.hearts.length === 4 &&
      suitGroups.diamonds.length === 4 &&
      suitGroups.clubs.length === 4 &&
      suitGroups.spades.length === 4
    ) {
      // Check if all cards have the same rank
      const rank = section[0].rank
      if (section.every((card) => card.rank === rank)) {
        // Check if they appear in the correct order: hearts, diamonds, clubs, spades
        const heartsIndices = suitGroups.hearts.map((c) => c.index)
        const diamondsIndices = suitGroups.diamonds.map((c) => c.index)
        const clubsIndices = suitGroups.clubs.map((c) => c.index)
        const spadesIndices = suitGroups.spades.map((c) => c.index)

        // Check if the max index of each suit is less than the min index of the next suit
        const maxHearts = Math.max(...heartsIndices)
        const minDiamonds = Math.min(...diamondsIndices)
        const maxDiamonds = Math.max(...diamondsIndices)
        const minClubs = Math.min(...clubsIndices)
        const maxClubs = Math.max(...clubsIndices)
        const minSpades = Math.min(...spadesIndices)

        if (maxHearts < minDiamonds && maxDiamonds < minClubs && maxClubs < minSpades) {
          patterns.push({
            id: 'consecutive_flush_quads',
            name: 'Consecutive Flush Quads',
            description: `All 4 ${rank} cards of each suit in sequence from positions ${i + 1} to ${
              i + 16
            }`,
            indices: section.map((c) => c.index),
            type: 'legendary',
          })
          break
        }
      }
    }
  }

  // Check for Consecutive Runs (3 consecutive straights - 15 cards)
  for (let i = 0; i <= deck.length - 15; i++) {
    const section = deck.slice(i, i + 15)

    // Check each 5-card segment for a straight
    const firstStraight = areCardsInSequence(section.slice(0, 5))
    const secondStraight = areCardsInSequence(section.slice(5, 10))
    const thirdStraight = areCardsInSequence(section.slice(10, 15))

    if (firstStraight && secondStraight && thirdStraight) {
      patterns.push({
        id: 'consecutive_runs',
        name: 'Consecutive Runs',
        description: `Three consecutive straights from positions ${i + 1} to ${i + 15}`,
        indices: section.map((c) => c.index),
        type: 'legendary',
      })
      break
    }
  }

  // Check for Suit Segregation (all 13 cards of one suit followed by all 13 of another)
  for (let i = 0; i <= deck.length - 26; i++) {
    const section = deck.slice(i, i + 26)
    const firstHalf = section.slice(0, 13)
    const secondHalf = section.slice(13, 26)

    // Check if all cards in each half are of the same suit
    const firstSuit = firstHalf[0].suit
    const secondSuit = secondHalf[0].suit

    if (
      firstSuit !== secondSuit &&
      firstHalf.every((card) => card.suit === firstSuit) &&
      secondHalf.every((card) => card.suit === secondSuit)
    ) {
      // Check if we have all 13 ranks in each suit
      const firstRanks = new Set(firstHalf.map((card) => card.rank))
      const secondRanks = new Set(secondHalf.map((card) => card.rank))

      if (firstRanks.size === 13 && secondRanks.size === 13) {
        patterns.push({
          id: 'suit_segregation',
          name: 'Suit Segregation',
          description: `All 13 ${firstSuit} followed by all 13 ${secondSuit} from positions ${
            i + 1
          } to ${i + 26}`,
          indices: section.map((c) => c.index),
          type: 'legendary',
        })
        break
      }
    }
  }

  return patterns
}

// Function to get date as YYYY-MM-DD
function getDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Store dates when daily achievements were earned
// Format: { achievement_id: Set<YYYY-MM-DD> }
const dailyAchievementDates: Record<string, Set<string>> = {
  midnight_shuffle: new Set<string>(),
}

// Check which achievements a shuffle qualifies for
export function checkAchievements(deck: Deck, userShuffleCount: number): Achievement[] {
  const earnedAchievements: Achievement[] = []
  const patterns = findPatterns(deck)
  const now = new Date()
  const today = getDateString(now)

  // Track which achievement types have been earned to prevent duplicates
  const earnedPatternTypes = new Set<string>()

  // Check pattern-based achievements
  for (const achievement of achievements) {
    if (achievement.type === 'pattern') {
      const patternId = achievement.criteria.patternId

      // Skip if no patternId is specified
      if (!patternId) continue

      // If we've already earned this type of pattern achievement, skip it
      if (earnedPatternTypes.has(patternId)) continue

      if (patterns.some((p) => p.id === patternId)) {
        earnedAchievements.push(achievement)
        // Mark this pattern type as earned
        earnedPatternTypes.add(patternId)
      }
    }

    // Check count-based achievements
    if (achievement.type === 'count') {
      const requiredCount = achievement.criteria.shuffleCount ?? 0
      if (userShuffleCount === requiredCount) {
        earnedAchievements.push(achievement)
      }
    }

    // Check time-based achievements
    if (achievement.type === 'time') {
      // Check time of day
      if (achievement.criteria.timeOfDay) {
        const { start, end } = achievement.criteria.timeOfDay
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute
          .toString()
          .padStart(2, '0')}`

        if (currentTime >= start && currentTime <= end) {
          // Special case for Night Owl achievement (midnight_shuffle)
          // Only earn it once per day
          if (achievement.id === 'midnight_shuffle') {
            // Check if this achievement was already earned today
            if (!dailyAchievementDates.midnight_shuffle.has(today)) {
              // Not earned today, so add it
              earnedAchievements.push(achievement)
              // Record that we earned it today
              dailyAchievementDates.midnight_shuffle.add(today)
            }
          } else {
            // For other time-based achievements, behave as before
            earnedAchievements.push(achievement)
          }
        }
      }

      // Check day of week
      if (achievement.criteria.dayOfWeek) {
        const currentDay = now.getDay()
        if (achievement.criteria.dayOfWeek.includes(currentDay)) {
          earnedAchievements.push(achievement)
        }
      }
    }
  }

  return earnedAchievements
}
