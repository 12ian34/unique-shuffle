import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Card } from '../types'
import { GAME_SETTINGS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function isValidCardCount(count: number): boolean {
  return count > 0 && count <= GAME_SETTINGS.MAX_CARDS_PER_SHUFFLE
}

export function getRandomCards(deck: Card[], count: number): Card[] {
  if (!isValidCardCount(count)) {
    throw new Error('Invalid card count')
  }

  const shuffled = [...deck].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait) as unknown as number
  }
}

export function getCardValue(card: Card): number {
  switch (card.value) {
    case 'A':
      return 1
    case 'J':
      return 11
    case 'Q':
      return 12
    case 'K':
      return 13
    default:
      return parseInt(card.value)
  }
} 