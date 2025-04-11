'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { GlobalShuffleCounter } from '@/components/global-shuffle-counter'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { UserStats, Card as CardType } from '@/types'

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
    label: 'analytics',
    href: '/analytics',
  },
  {
    label: 'profile',
    href: '/profile',
  },
]

export function NavbarWithStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const statsTimestampRef = useRef<number>(0)

  // Use a shared Supabase client
  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  const loadUserStats = useCallback(async () => {
    try {
      // Don't reload stats more than once per second to prevent performance issues
      const now = Date.now()
      if (now - statsTimestampRef.current < 1000 && !isLoading) {
        return
      }
      statsTimestampRef.current = now

      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Set authentication state
      setIsAuthenticated(!!user)

      if (!user) {
        setIsLoading(false)
        setStats(null)
        return
      }

      // Just get stats from leaderboard table without complex calculation
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('total_shuffles, shuffle_streak, achievements_count')
        .eq('user_id', user.id)
        .single()

      if (leaderboardError) {
        // If no data, just set zeros (will be created by save API later)
        setStats({
          total_shuffles: 0,
          shuffle_streak: 0,
          achievements_count: 0,
          most_common_cards: [],
        })
      } else {
        // Create minimal stats object for navbar
        const newStats: UserStats = {
          total_shuffles: leaderboardData.total_shuffles || 0,
          shuffle_streak: leaderboardData.shuffle_streak || 0,
          achievements_count: leaderboardData.achievements_count || 0,
          most_common_cards: [],
        }

        setStats(newStats)
      }
    } catch (error) {
      console.error('Failed to load user stats for navbar:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, isLoading])

  useEffect(() => {
    // Initial load
    loadUserStats()

    // Only setup the subscription once
    if (subscriptionRef.current) return

    // Listen for auth state changes
    const authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadUserStats()
      }
    })

    // Add listener for custom refresh event - this will sync with shuffle actions
    const handleRefreshEvent = () => {
      loadUserStats()
    }
    window.addEventListener('refresh-global-counter', handleRefreshEvent)

    // Subscribe to leaderboard changes directly instead of global_shuffles
    // This will only trigger when the actual stats change
    const leaderboardSubscription = supabase
      .channel('navbar-user-stats')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'leaderboard',
        },
        (payload) => {
          loadUserStats()
        }
      )
      .subscribe()

    // Store subscription reference for cleanup
    subscriptionRef.current = {
      unsubscribe: () => {
        window.removeEventListener('refresh-global-counter', handleRefreshEvent)
        leaderboardSubscription.unsubscribe()
        authListener.data.subscription.unsubscribe()
      },
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [loadUserStats, supabase])

  return <Navbar userStats={stats || undefined} isAuthenticated={isAuthenticated} />
}

export function Navbar({
  userStats,
  isAuthenticated,
}: {
  userStats?: UserStats | null
  isAuthenticated: boolean
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
    // Special case for Analytics: when on /dashboard, highlight the Analytics tab
    if (itemHref === '/analytics' && pathname === '/dashboard') {
      return true
    }
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
