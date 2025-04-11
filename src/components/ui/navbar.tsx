'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { GlobalShuffleCounter } from '@/components/global-shuffle-counter'
import { createDisabledRealtimeClient } from '@/lib/supabase-browser'
import { Database } from '@/types/supabase'
import { UserStats, Card as CardType } from '@/types'
import { getUserStats, subscribeToStats, fetchStats, initializeStats } from '@/lib/stats-store'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  {
    label: 'shuffle',
    href: '/',
  },
  {
    label: 'achievements',
    href: '/achievements',
  },
  {
    label: 'leaderboard',
    href: '/stats',
  },
  {
    label: 'saved',
    href: '/saved-shuffles',
  },
  {
    label: 'profile',
    href: '/profile',
  },
]

// Module-level flag to prevent concurrent loads
let isStatsLoadInProgress = false
// Module-level minimum time between refreshes (30 seconds)
const MIN_NAVBAR_REFRESH_INTERVAL = 30000
// When was the last refresh
let lastNavbarRefreshTime = 0

export function NavbarWithStats() {
  // Use null as initial value until we get real data from the store
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // First, initialize the stats store on mount (client-side only)
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        // Initialize the store (this is now safe on client-side)
        await initializeStats()
        // Get initial stats from the store
        const initialStats = getUserStats()
        setStats(initialStats)
        setIsAuthenticated(!!initialStats)
        setIsInitialized(true)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Subscribe to the stats store for updates after initialization
  useEffect(() => {
    // Skip if not initialized yet
    if (!isInitialized) return

    // Function to update from the store
    const handleStatsUpdate = () => {
      const newStats = getUserStats()
      setStats(newStats)
      setIsAuthenticated(!!newStats)
    }

    // Subscribe to future updates
    const unsubscribe = subscribeToStats(handleStatsUpdate)

    // Unsubscribe on unmount
    return unsubscribe
  }, [isInitialized])

  // Handle manual refresh
  const handleManualRefresh = async () => {
    setIsLoading(true)
    try {
      await fetchStats(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Navbar
      userStats={stats || undefined}
      isAuthenticated={isAuthenticated}
      onRefreshAction={handleManualRefresh}
    />
  )
}

export function Navbar({
  userStats,
  isAuthenticated,
  onRefreshAction,
}: {
  userStats?: UserStats | null
  isAuthenticated: boolean
  onRefreshAction: () => Promise<void>
}) {
  const pathname = usePathname()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to active tab on mount and when pathname changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTab = scrollContainerRef.current.querySelector('[data-active="true"]')
      if (activeTab) {
        setTimeout(() => {
          activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }, 100)
      }
    }
  }, [pathname])

  // Check if current path should be considered active for a nav item
  const isPathActive = (itemHref: string) => {
    return pathname === itemHref
  }

  return (
    <nav className='bg-[rgb(8,12,25)] border-b border-slate-800 sticky top-0 z-50'>
      <div className='max-w-screen-xl mx-auto'>
        <div className='flex justify-between items-center px-4'>
          <div className='flex-shrink-0 py-3 pl-2 hidden md:block'>
            <GlobalShuffleCounter variant='navbar' userStats={userStats || undefined} />
          </div>
          {isAuthenticated && (
            <div
              ref={scrollContainerRef}
              className='w-full overflow-x-auto flex no-scrollbar'
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className='flex w-max mx-auto'>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={isPathActive(item.href)}
                    className={cn(
                      'whitespace-nowrap px-5 py-3 text-sm font-medium transition-all border-b-2',
                      isPathActive(item.href)
                        ? 'text-indigo-500 border-indigo-500'
                        : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-700'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!isAuthenticated && (
            <div className='w-full flex justify-center items-center py-3 gap-4'>
              <div className='text-indigo-400 font-medium text-lg'>unique shuffle</div>
            </div>
          )}
          <div className='flex-shrink-0 py-3 pr-2 hidden md:block'>
            <div className='w-[120px]'></div>
          </div>
        </div>
        <div className='md:hidden flex justify-center py-1.5 border-t border-slate-800/50'>
          <GlobalShuffleCounter variant='navbar' userStats={userStats || undefined} />
        </div>
      </div>
    </nav>
  )
}
