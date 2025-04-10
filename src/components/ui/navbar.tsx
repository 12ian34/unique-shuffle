'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { GlobalShuffleCount } from '@/components/global-shuffle-count'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Shuffle',
    href: '/shuffle',
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
  },
  {
    label: 'Analytics',
    href: '/analytics',
  },
  {
    label: 'Profile',
    href: '/profile',
  },
]

export function Navbar() {
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
            <GlobalShuffleCount />
          </div>
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
          <div className='flex-shrink-0 py-3 pr-2 hidden md:block'>
            <div className='w-[120px]'></div>
          </div>
        </div>
        <div className='md:hidden flex justify-center py-1.5 border-t border-slate-800/50'>
          <GlobalShuffleCount />
        </div>
      </div>
    </nav>
  )
}
