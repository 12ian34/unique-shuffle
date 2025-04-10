'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui'
import { Button } from '@/components/ui'
import { Database } from '@/types/supabase'

interface UserProfile {
  email: string
  username: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error(userError.message)
      }

      if (!userData.user) {
        window.location.href = '/auth'
        return
      }

      // Fetch user profile data
      const response = await fetch(`/api/users/profile?userId=${userData.user.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const profileData = await response.json()

      setProfile({
        email: profileData.user.email || '',
        username: profileData.profile?.username || '',
      })

      // Initialize form fields
      setEmail(profileData.user.email || '')
      setUsername(profileData.profile?.username || '')
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      // Validate password
      if (password && password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error('User not authenticated')
      }

      // Prepare update data
      const updateData: Record<string, string> = { userId: userData.user.id }

      if (username && username !== profile?.username) {
        updateData.username = username
      }

      if (email && email !== profile?.email) {
        updateData.email = email
      }

      if (password) {
        updateData.password = password
      }

      // Only update if there are changes
      if (Object.keys(updateData).length <= 1) {
        setError('No changes to update')
        return
      }

      // Update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()

      setSuccess('Profile updated successfully')
      setPassword('')
      setConfirmPassword('')

      // Refresh profile data
      fetchProfile()
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <div className='max-w-xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6'>Edit Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Update your account information below</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className='space-y-4'>
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
                  {error}
                </div>
              )}

              {success && (
                <div className='bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded'>
                  {success}
                </div>
              )}

              <div className='space-y-2'>
                <label htmlFor='username' className='block text-sm font-medium'>
                  Username
                </label>
                <input
                  id='username'
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Your username'
                />
                <p className='text-sm text-gray-500'>
                  Username must be between 3-20 characters and can only contain letters, numbers,
                  and underscores.
                </p>
              </div>

              <div className='space-y-2'>
                <label htmlFor='email' className='block text-sm font-medium'>
                  Email Address
                </label>
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='your-email@example.com'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='password' className='block text-sm font-medium'>
                  New Password
                </label>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Leave blank to keep current password'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='confirmPassword' className='block text-sm font-medium'>
                  Confirm New Password
                </label>
                <input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Confirm new password'
                />
              </div>
            </CardContent>

            <CardFooter className='flex justify-between'>
              <Button variant='outline' type='button' onClick={() => (window.location.href = '/')}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
