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
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateUsername } from '@/utils/username-generator'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(generateUsername())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        // Clean up the URL
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('error')
        router.replace(cleanUrl.pathname + cleanUrl.search)
      }
    }
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error, data } = await signUp(email, password, username)

      if (error) throw error

      if (!data?.session) {
        // User needs to verify email
        setSuccess('Account created successfully! Please check your email for a confirmation link.')
        setEmail('')
        setPassword('')
        setUsername(generateUsername())
      } else {
        // Auto-login case (shouldn't happen with email verification)
        setSuccess('Account created successfully!')
        // Router will auto-redirect due to session change
      }
    } catch (err: any) {
      console.error('Sign up error:', err)
      setError(err.message || 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)

      if (error) throw error

      // No need to redirect - auth provider will update session and trigger redirect
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='max-w-md mx-auto pt-8'>
      <Tabs defaultValue='login'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='login'>Login</TabsTrigger>
          <TabsTrigger value='signup'>Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value='login'>
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Sign in to your account to save shuffles and track achievements
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='email-login'>
                    Email
                  </label>
                  <input
                    id='email-login'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full p-2 border rounded-md'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='password-login'>
                    Password
                  </label>
                  <input
                    id='password-login'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full p-2 border rounded-md'
                    required
                  />
                </div>

                {error && (
                  <div className='text-sm text-red-500 p-2 bg-red-50 rounded-md'>{error}</div>
                )}
              </CardContent>
              <CardFooter>
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value='signup'>
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Sign up to track your achievements and save your favorite shuffles
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignUp}>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='username-signup'>
                    Username
                  </label>
                  <div className='flex'>
                    <input
                      id='username-signup'
                      type='text'
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className='w-full p-2 border rounded-l-md'
                      required
                    />
                    <Button
                      type='button'
                      variant='secondary'
                      className='rounded-l-none'
                      onClick={() => setUsername(generateUsername())}
                    >
                      Random
                    </Button>
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='email-signup'>
                    Email
                  </label>
                  <input
                    id='email-signup'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full p-2 border rounded-md'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium' htmlFor='password-signup'>
                    Password
                  </label>
                  <input
                    id='password-signup'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full p-2 border rounded-md'
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className='text-sm text-red-500 p-2 bg-red-50 rounded-md'>{error}</div>
                )}

                {success && (
                  <div className='text-sm text-green-500 p-2 bg-green-50 rounded-md'>{success}</div>
                )}
              </CardContent>
              <CardFooter>
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
