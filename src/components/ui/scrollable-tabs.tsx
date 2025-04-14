'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

const Tabs = TabsPrimitive.Root

interface ScrollableTabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: 'default' | 'underline'
}

const ScrollableTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  ScrollableTabsListProps
>(({ className, variant = 'default', ...props }, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabsListRef = useRef<HTMLDivElement>(null)
  const [showLeftIndicator, setShowLeftIndicator] = useState(false)
  const [showRightIndicator, setShowRightIndicator] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)

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
    <div className='relative w-full'>
      {/* Left fade indicator */}
      {showLeftIndicator && (
        <div className='absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none'></div>
      )}

      <div ref={scrollContainerRef} className='overflow-x-auto hide-scrollbar w-full'>
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            'inline-flex min-w-max items-center whitespace-nowrap w-max',
            variant === 'default' && 'h-10 rounded-md bg-muted p-1 text-muted-foreground',
            variant === 'underline' && 'h-9 border-b border-border text-muted-foreground',
            showScrollHint && 'scroll-hint',
            className
          )}
          {...props}
        />
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
  )
})
ScrollableTabsList.displayName = 'ScrollableTabsList'

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: 'default' | 'underline'
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
      variant === 'default' &&
        'rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      variant === 'underline' &&
        'h-9 px-4 py-1 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, ScrollableTabsList, TabsTrigger, TabsContent }
