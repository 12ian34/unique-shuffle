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
    }
  }, [router])

  // Function to toggle between login and signup modes
  const toggleMode = () => {
    setIsSignUp((prev) => !prev)
    // Clear form state when switching modes
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        // Sign up flow
        const { error, data } = await signUp(email, password, username)

        if (error) throw error

        if (!data?.session) {
          // User needs to verify email
          setSuccess(
            'Account created successfully! Please check your email for a confirmation link.'
          )
          setEmail('')
          setPassword('')
          setUsername(generateUsername())
        } else {
          // Auto-login case (shouldn't happen with email verification)
          setSuccess('Account created successfully!')
          // Router will auto-redirect due to session change
        }
      } else {
        // Sign in flow
        const { error } = await signIn(email, password)
        if (error) throw error
        // No need to redirect - auth provider will update session and trigger redirect
      }
    } catch (err: any) {
      console.error(`${isSignUp ? 'Sign up' : 'Login'} error:`, err)
      setError(err.message || `An error occurred during ${isSignUp ? 'signup' : 'login'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='max-w-md mx-auto pt-8 px-4'>
      <Card className='border-border/30 shadow-lg transition-all duration-300'>
        <CardHeader>
          <CardTitle className='text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Sign up to track your achievements and save your favorite shuffles'
              : 'Sign in to your account to access your saved shuffles and achievements'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-end space-x-2 mb-4'>
              <Label
                htmlFor='auth-mode'
                className={`text-sm ${!isSignUp ? 'font-medium' : 'text-muted-foreground'}`}
              >
                Login
              </Label>
              <Switch id='auth-mode' checked={isSignUp} onCheckedChange={toggleMode} />
              <Label
                htmlFor='auth-mode'
                className={`text-sm ${isSignUp ? 'font-medium' : 'text-muted-foreground'}`}
              >
                Sign Up
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
                    className='rounded-r-none'
                    required={isSignUp}
                    disabled={!isSignUp || isLoading}
                  />
                  <Button
                    type='button'
                    variant='secondary'
                    className='rounded-l-none'
                    onClick={() => setUsername(generateUsername())}
                    disabled={!isSignUp || isLoading}
                  >
                    Random
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email-input'>Email</Label>
                <Input
                  id='email-input'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder='your.email@example.com'
                  autoComplete={isSignUp ? 'email' : 'username'}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password-input'>Password</Label>
                <Input
                  id='password-input'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={isSignUp ? 6 : undefined}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
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
                  {isSignUp ? 'Create Account' : 'Sign In'}
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
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
