'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAVIGATION_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from './button'
import { useAuth } from '@/contexts/AuthContext'

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Filter navigation items based on auth state
  const navigationItems = NAVIGATION_ITEMS.filter((item) => {
    // Hide profile if not logged in
    if (item.path === '/profile' && !user) {
      return false
    }
    return true
  })

  return (
    <nav className={cn('flex flex-col w-full bg-background sticky top-0 z-50 border-b', className)}>
      <div className='flex items-center justify-between px-4 h-14'>
        <Link href='/' className='font-bold text-xl'>
          Unique Shuffle
        </Link>

        {/* Mobile menu button */}
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </Button>

        {/* Desktop navigation */}
        <div className='hidden md:flex items-center space-x-4'>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {item.name}
            </Link>
          ))}

          {user ? (
            <Button variant='ghost' onClick={signOut} className='text-sm font-medium'>
              Sign Out
            </Button>
          ) : (
            <Link
              href='/auth'
              className='px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted'
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className='md:hidden px-4 py-2 border-t flex flex-col space-y-2'>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          {user ? (
            <Button
              variant='ghost'
              onClick={() => {
                signOut()
                setIsMenuOpen(false)
              }}
              className='text-sm font-medium justify-start'
            >
              Sign Out
            </Button>
          ) : (
            <Link
              href='/auth'
              className='px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted'
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
