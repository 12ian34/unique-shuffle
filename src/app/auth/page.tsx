'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { generateUsername } from '@/utils/username-generator'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRightIcon, CheckIcon } from '@radix-ui/react-icons'
import { trackEvent } from '@/lib/analytics'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(generateUsername())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  // Check for error parameter or auth tokens in URL on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for error in query params
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error')
      const tabParam = params.get('tab')

      // Set signup mode if specified in URL
      if (tabParam === 'signup') {
        setIsSignUp(true)
      }

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        // Clean up the URL
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('error')
        router.replace(cleanUrl.pathname + cleanUrl.search)
      }

      // Track auth page view (funnel step)
      trackEvent('auth_page_viewed', {
        mode: tabParam === 'signup' ? 'signup' : 'login',
        referrer: document.referrer || 'direct',
      })
    }
  }, [router])

  // Function to toggle between login and signup modes
  const toggleMode = () => {
    // Track auth mode toggle (funnel step)
    trackEvent('auth_mode_toggled', {
      from: isSignUp ? 'signup' : 'login',
      to: isSignUp ? 'login' : 'signup',
    })

    setIsSignUp((prev) => !prev)
    // Clear form state when switching modes
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Track form submission (funnel step)
    trackEvent('auth_form_submitted', {
      mode: isSignUp ? 'signup' : 'login',
      hasUsername: !!username.trim(),
      hasEmail: !!email.trim(),
      passwordLength: password.length,
    })

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        // Sign up flow
        const { error } = await signUp(email, password, username)

        if (error) throw error

        // If no error, assume success and email verification is needed
        setSuccess('Account created successfully! Please check your email for a confirmation link.')

        // Track verification needed (funnel step)
        trackEvent('auth_verification_needed', {
          email: email.includes('@') ? email.split('@')[1] : 'unknown',
        })

        setEmail('')
        setPassword('')
        setUsername(generateUsername())
      } else {
        // Sign in flow
        const { error } = await signIn(email, password)
        if (error) throw error
        // No need to redirect - auth provider will update session and trigger redirect
      }
    } catch (err: any) {
      console.error(`${isSignUp ? 'sign up' : 'login'} error:`, err)
      setError(err.message || `An error occurred during ${isSignUp ? 'signup' : 'login'}`)

      // Track auth error (funnel step)
      trackEvent('auth_error', {
        mode: isSignUp ? 'signup' : 'login',
        error: err.message || 'Unknown error',
        step: 'form_submission',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Track form field interactions
  const trackFieldInteraction = (field: string) => {
    trackEvent('auth_field_interaction', {
      mode: isSignUp ? 'signup' : 'login',
      field: field,
    })
  }

  return (
    <div className='max-w-md mx-auto pt-8 px-4'>
      <Card className='border-border/30 shadow-lg transition-all duration-300'>
        <CardHeader>
          <CardTitle className='text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>
            {isSignUp ? 'sign up' : 'welcome back'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'sign up to track achievements and save fave shuffles'
              : 'login to access saved shuffles and achievements'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-end space-x-2 mb-4'>
              <Label
                htmlFor='auth-mode'
                className={`text-sm ${!isSignUp ? 'font-medium' : 'text-muted-foreground'}`}
              >
                login
              </Label>
              <Switch id='auth-mode' checked={isSignUp} onCheckedChange={toggleMode} />
              <Label
                htmlFor='auth-mode'
                className={`text-sm ${isSignUp ? 'font-medium' : 'text-muted-foreground'}`}
              >
                sign up
              </Label>
            </div>

            <div className='space-y-4'>
              <div
                className={`space-y-2 transition-all duration-300 ${
                  isSignUp ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <Label htmlFor='username-input'>Username</Label>
                <div className='flex'>
                  <Input
                    id='username-input'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => trackFieldInteraction('username')}
                    className='rounded-r-none'
                    required={isSignUp}
                    disabled={!isSignUp || isLoading}
                  />
                  <Button
                    type='button'
                    variant='secondary'
                    className='rounded-l-none'
                    onClick={() => {
                      trackEvent('username_generator_used')
                      setUsername(generateUsername())
                    }}
                    disabled={!isSignUp || isLoading}
                  >
                    Random
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email-input'>email</Label>
                <Input
                  id='email-input'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => trackFieldInteraction('email')}
                  required
                  disabled={isLoading}
                  placeholder='your.email@example.com'
                  autoComplete={isSignUp ? 'email' : 'username'}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password-input'>password</Label>
                <Input
                  id='password-input'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => trackFieldInteraction('password')}
                  required
                  disabled={isLoading}
                  minLength={isSignUp ? 6 : undefined}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'at least 6 characters' : 'your password'}
                />
              </div>
            </div>

            {error && (
              <div className='text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-100 animate-in fade-in'>
                {error}
              </div>
            )}

            {success && (
              <div className='text-sm text-green-500 p-3 bg-green-50 rounded-md border border-green-100 flex items-start gap-2 animate-in fade-in'>
                <CheckIcon className='h-5 w-5 mt-0.5 shrink-0' />
                <span>{success}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className='flex flex-col space-y-2'>
            <Button type='submit' className='w-full group' disabled={isLoading} size='lg'>
              {isLoading ? (
                <>
                  <svg
                    className='mr-2 h-4 w-4 animate-spin'
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M21 12a9 9 0 1 1-6.219-8.56' />
                  </svg>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {isSignUp ? 'sign up' : 'login'}
                  <ArrowRightIcon className='ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform' />
                </>
              )}
            </Button>

            <button
              type='button'
              className='text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 cursor-pointer'
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isSignUp ? 'already have an account? login' : 'need an account? sign up'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
