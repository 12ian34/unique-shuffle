'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import Link from 'next/link'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      router.push('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      router.push('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex flex-col items-center  bg-[rgb(10,15,30)] p-4'>
      <div className='w-full max-w-md'>
        <div className='mt-8 text-center text-sm text-slate-500'>
          <p>
            each unique shuffle of a deck of 52 cards is 1 in{' '}
            <span className='font-mono text-indigo-400 break-all inline-block max-w-full'>
              80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
            </span>{' '}
          </p>
        </div>
        <br></br>
        <Card className='border-slate-800 bg-[rgb(8,12,25)] shadow-xl'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-center text-3xl font-bold text-indigo-400'>
              get shuffling
            </CardTitle>
            <CardDescription className='text-center text-sm text-slate-400'>
              {isSignUp ? 'sign up' : 'sign in'}
            </CardDescription>
          </CardHeader>

          <CardContent className='pt-6'>
            {error && (
              <div className='mb-4 rounded border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400'>
                {error}
              </div>
            )}

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='email' className='text-sm font-medium text-slate-300'>
                    email
                  </label>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    required
                    className='w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <label htmlFor='password' className='text-sm font-medium text-slate-300'>
                    password
                  </label>
                  <input
                    id='password'
                    name='password'
                    type='password'
                    required
                    className='w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                    placeholder='••••••••'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading
                    ? isSignUp
                      ? 'signing up...'
                      : 'signing in...'
                    : isSignUp
                    ? 'sign up'
                    : 'sign in'}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className='flex flex-col items-center justify-center border-t border-slate-800 pt-6'>
            <div className='text-sm text-slate-400'>
              {isSignUp ? 'already have an account?' : 'need an account?'}
              <Button
                variant='link'
                className='ml-1 pl-1 font-medium text-indigo-400'
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'sign in' : 'sign up'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
