import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistance } from 'date-fns'

// Utility for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a date to a human-readable string
export function formatDate(date: string | Date): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format a date relative to now (e.g., "2 days ago")
export function formatRelativeDate(date: string | Date): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

// Generate a random string of specified length
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

// Convert a large number to a human-readable string with abbreviations
export function formatLargeNumber(num: number): string {
  if (num < 1000) return num.toString()

  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`.replace('.0K', 'K')
  }

  if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`.replace('.0M', 'M')
  }

  return `${(num / 1000000000).toFixed(1)}B`.replace('.0B', 'B')
}

// Convert a number to an ordinal string (1st, 2nd, 3rd, etc.)
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// Create a "debounced" version of a function
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}

// Create a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Group an array by a key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, currentValue) => {
    const groupKey = String(currentValue[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(currentValue)
    return result
  }, {} as Record<string, T[]>)
}

// Sleep for a specified time
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
