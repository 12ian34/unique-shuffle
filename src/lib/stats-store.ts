import { UserStats } from '@/types'

// GLOBAL APPLICATION STATE STORE
// This will be the only source of truth for stats in the app
// All components will use this instead of making their own API calls

// State types
interface GlobalStats {
  totalShuffles: number
  lastUpdated: number
}

interface UserStatsState {
  stats: UserStats | null
  lastUpdated: number
}

// Global state with initial values
const store = {
  global: {
    totalShuffles: 0,
    lastUpdated: 0,
  } as GlobalStats,
  user: {
    stats: null,
    lastUpdated: 0,
  } as UserStatsState,

  // Control flags
  isLoading: false,
  isRefreshing: false,

  // Listeners for state changes
  listeners: new Set<() => void>(),

  // Minimum times between refreshes
  MIN_REFRESH_INTERVAL: 60000, // 60 seconds minimum between API calls
}

// Update state and notify listeners
function notifyListeners() {
  store.listeners.forEach((listener) => listener())
}

// Subscribe to changes
export function subscribeToStats(listener: () => void) {
  store.listeners.add(listener)
  return () => {
    store.listeners.delete(listener)
  }
}

// Get the current global count (optimistic - will be updated soon)
export function getGlobalCount(): number {
  return store.global.totalShuffles
}

// Get the user stats (if available)
export function getUserStats(): UserStats | null {
  return store.user.stats
}

// Update counts directly from shuffle events (optimistic updates)
export async function updateCountFromEvent(count: number | null | undefined, isUserAction = false) {
  if (typeof count === 'number') {
    // Store the new count so we can compare after refresh
    const newGlobalCount = count

    // Update the global count optimistically
    store.global.totalShuffles = newGlobalCount
    store.global.lastUpdated = Date.now()

    // Notify listeners about the optimistic update
    notifyListeners()

    // Fetch user stats separately without overriding our optimistic global count
    if (isUserAction) {
      try {
        const timestamp = Date.now()
        const userResponse = await fetch(`/api/user/stats?timestamp=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
        })

        if (userResponse.ok) {
          const data = await userResponse.json()
          if (data.stats) {
            // Update only user stats from server data
            console.log(
              `Stats Store: Updated user stats from server: ${data.stats.total_shuffles} shuffles, streak ${data.stats.shuffle_streak} days`
            )
            store.user.stats = data.stats
            store.user.lastUpdated = Date.now()

            // Make sure we keep our latest global count
            store.global.totalShuffles = newGlobalCount

            // Notify listeners of the user stats update
            notifyListeners()
          }
        }
      } catch (error) {
        console.error('Failed to fetch updated user stats:', error)
      }
    }

    return true
  }
  return false
}

// Fetch the latest stats - but only if really needed
export async function fetchStats(forceRefresh = false): Promise<boolean> {
  // Skip if on server side
  if (typeof window === 'undefined') {
    console.log('Stats Store: Skipping fetch on server')
    return false
  }

  // Skip if already loading
  if (store.isLoading) {
    console.log('Stats Store: Already loading stats, skipping duplicate request')
    return false
  }

  // Skip if too recent (unless forced)
  const now = Date.now()
  if (!forceRefresh && now - store.global.lastUpdated < store.MIN_REFRESH_INTERVAL) {
    console.log(`Stats Store: Last refresh was ${now - store.global.lastUpdated}ms ago, too recent`)
    return false
  }

  try {
    // Mark as loading
    store.isLoading = true
    console.log('Stats Store: Actually fetching stats')

    // Track success
    let success = false

    // First try to get the global count (this is fast and always works)
    try {
      const timestamp = now
      const response = await fetch(`/api/shuffles/count?timestamp=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const data = await response.json()
        const count = data.total !== undefined ? data.total : data.count

        if (typeof count === 'number') {
          console.log(`Stats Store: Updated global count to ${count}`)
          store.global.totalShuffles = count
          store.global.lastUpdated = now
          success = true
        }
      }
    } catch (error) {
      console.error('Failed to fetch global count:', error)
    }

    // Then, get user-specific stats which will only work for authenticated users
    try {
      const timestamp = now
      const userResponse = await fetch(`/api/user/stats?timestamp=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
        next: { revalidate: 0 },
      })

      if (userResponse.ok) {
        const data = await userResponse.json()
        if (data.stats) {
          console.log(
            `Stats Store: Updated user stats from server: ${data.stats.total_shuffles} shuffles, streak ${data.stats.shuffle_streak} days`
          )
          store.user.stats = data.stats
          store.user.lastUpdated = now
          success = true
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }

    // Notify all listeners if anything changed
    if (success) {
      notifyListeners()
    }

    return success
  } finally {
    // Always reset loading state
    store.isLoading = false
  }
}

// Add a flag to track if we've initialized
let hasInitialized = false

// Initialize with a first fetch - called ON DEMAND, not at import time
export async function initializeStats() {
  // Skip if already initialized or we're on the server
  if (hasInitialized || typeof window === 'undefined') {
    return false
  }

  console.log('Stats Store: Initializing store with initial data')
  hasInitialized = true

  // Add a timeout to prevent blocking the UI
  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      console.log('Stats Store: Initialization timed out, continuing with default values')
      resolve(false)
    }, 3000) // 3 second timeout
  })

  // Race the fetch against the timeout
  const result = await Promise.race([fetchStats(true), timeoutPromise])

  // Optimistically set streak to 1 for users who have shuffles but no streak yet
  if (
    store.user.stats &&
    store.user.stats.total_shuffles > 0 &&
    store.user.stats.shuffle_streak === 0
  ) {
    console.log('Stats Store: Setting initial streak to 1 day for user with existing shuffles')
    store.user.stats.shuffle_streak = 1
    notifyListeners()
  }

  return result
}

// Handle shuffle completed events - update optimistically but also fetch when needed
export function handleShuffleCompleted(event: CustomEvent) {
  const { count, type, isUserAction } = event.detail || {}

  // If we have a count, update optimistically
  if (typeof count === 'number') {
    // For regular shuffles and save events, always update stats
    // This ensures streak gets updated properly
    const shouldUpdateUserStats = isUserAction !== false

    console.log(
      `Stats Store: Handling ${type} event, count=${count}, isUserAction=${shouldUpdateUserStats}`
    )

    // Update counts optimistically - this will also fetch user stats if needed
    updateCountFromEvent(count, shouldUpdateUserStats)
    return
  }

  // If we don't have a count in the event, only refresh user stats to avoid
  // interfering with optimistic global updates
  const now = Date.now()
  if (now - store.user.lastUpdated > store.MIN_REFRESH_INTERVAL) {
    console.log('Stats Store: No count in event, scheduling user stats refresh')

    setTimeout(async () => {
      try {
        const timestamp = Date.now()
        const userResponse = await fetch(`/api/user/stats?timestamp=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
          cache: 'no-store',
        })

        if (userResponse.ok) {
          const data = await userResponse.json()
          if (data.stats) {
            // Update only user stats from server data
            console.log(
              `Stats Store: Updated user stats from server: ${data.stats.total_shuffles} shuffles, streak ${data.stats.shuffle_streak} days`
            )
            store.user.stats = data.stats
            store.user.lastUpdated = Date.now()

            // Notify listeners of the user stats update
            notifyListeners()
          }
        }
      } catch (error) {
        console.error('Failed to fetch updated user stats:', error)
      }
    }, 2000)
  }
}

// Setup global event listener to catch events
function setupEventListeners() {
  // Skip on server
  if (typeof window === 'undefined') return

  // Listen for shuffle completed events
  window.addEventListener('shuffle-completed', (event: Event) => {
    const customEvent = event as CustomEvent
    handleShuffleCompleted(customEvent)
  })

  console.log('Stats Store: Event listeners initialized')
}

// Don't auto-initialize at import time anymore
// Let components call initializeStats() themselves when needed
// This prevents static build errors

// But we can still setup listeners on client
if (typeof window !== 'undefined') {
  // Safe to set up event listeners (but no data fetching yet)
  setupEventListeners()
}
