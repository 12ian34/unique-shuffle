'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAVIGATION_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const navLinksRef = useRef<HTMLDivElement>(null)
  const [showLeftIndicator, setShowLeftIndicator] = useState(false)
  const [showRightIndicator, setShowRightIndicator] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)

  // Filter navigation items to exclude Profile (since it's in the top-right)
  // and hide items that require authentication
  const navigationItems = NAVIGATION_ITEMS.filter((item) => {
    // Hide profile entirely as it's already in the right corner
    if (item.path === '/profile') {
      return false
    }

    // Hide any other auth-required items when not logged in
    // (can add more conditions here if needed)

    return true
  })

  // Check scroll position to show/hide indicators
  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current

    setShowLeftIndicator(scrollLeft > 8) // Show left indicator if scrolled right
    setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 8) // Show right indicator if can scroll more
  }

  // Set up scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScroll)
      // Check on initial render
      checkScroll()

      // Check if we need to show the scroll hint
      if (scrollContainer.scrollWidth > scrollContainer.clientWidth) {
        // Show the right indicator immediately
        setShowRightIndicator(true)

        // Apply scroll hint animation with a slight delay
        setTimeout(() => {
          setShowScrollHint(true)

          // Remove the animation class after it plays
          setTimeout(() => {
            setShowScrollHint(false)
          }, 2500)
        }, 500)
      }
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScroll)
      }
    }
  }, [])

  return (
    <nav
      className={cn(
        'flex flex-col w-full bg-background sticky top-0 z-50 border-b border-border overflow-hidden',
        className
      )}
    >
      <div className='flex items-center justify-between px-4 h-16 w-full max-w-full'>
        {/* Scrollable navigation bar with indicators */}
        <div className='flex-1 flex items-center relative max-w-[calc(100%-80px)]'>
          {/* Left fade indicator */}
          {showLeftIndicator && (
            <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none'></div>
          )}

          <div
            ref={scrollContainerRef}
            className='flex-1 overflow-x-auto hide-scrollbar px-1 w-full max-w-full touch-pan-x'
          >
            <div
              ref={navLinksRef}
              className={cn(
                'flex space-x-2 py-1 w-max min-h-[48px] items-center',
                showScrollHint && 'scroll-hint'
              )}
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0',
                    // Special styling for the Shuffle text
                    item.name === 'Shuffle' &&
                      'font-bold shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all',
                    pathname === item.path
                      ? item.name === 'Shuffle'
                        ? 'border-b-2 border-primary drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                        : 'text-primary border-b-2 border-primary'
                      : item.name === 'Shuffle'
                      ? ''
                      : 'text-muted-foreground hover:text-foreground focus-effect'
                  )}
                >
                  {item.name === 'Shuffle' ? (
                    <span className='relative group'>
                      <span className='relative z-10 font-bold tracking-wider text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.7)] animate-glow-text-subtle'>
                        Shuffle
                      </span>
                      <span className='absolute inset-0 -z-10 blur-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-80 rounded-md group-hover:opacity-90 group-hover:blur-md transition-all'></span>
                      <span className='absolute -inset-1 -z-20 scale-90 opacity-30 group-hover:opacity-40 group-hover:scale-110 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-xl rounded-lg transition-all duration-300'></span>
                    </span>
                  ) : (
                    item.name
                  )}
                </Link>
              ))}
              <div className='w-2 flex-shrink-0'></div>
            </div>
          </div>

          {/* Right fade indicator with arrow */}
          {showRightIndicator && (
            <div className='absolute right-0 top-0 bottom-0 z-10 flex items-center'>
              <div className='w-12 bg-gradient-to-l from-background to-transparent pointer-events-none h-full'></div>
              <div className='absolute right-0 mr-1 text-primary arrow-pulse'>
                <ChevronRight size={18} />
              </div>
            </div>
          )}
        </div>

        {/* Sign in/out button */}
        <div className='flex items-center ml-2 flex-shrink-0'>
          {user ? (
            <Link
              href='/profile'
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                pathname === '/profile'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground focus-effect'
              )}
            >
              profile
            </Link>
          ) : (
            <Link
              href='/auth'
              className='px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
            >
              login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
