import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Auth callback handler
export async function GET(request: Request) {
  const { searchParams, hash } = new URL(request.url)
  const code = searchParams.get('code')
  // Always redirect to profile page after confirmation to ensure user record is verified
  const next = searchParams.get('next') || '/profile'

  // Check if there's an error in the hash fragment
  if (hash && hash.includes('error=')) {
    // Parse error from hash
    const errorParams = new URLSearchParams(hash.substring(1))
    const error = errorParams.get('error')
    const errorCode = errorParams.get('error_code')
    const errorDesc = errorParams.get('error_description') || 'Authentication error'

    // Redirect to auth page with error message
    const authUrl = new URL('/auth', request.url)
    authUrl.searchParams.set('error', errorDesc)
    return NextResponse.redirect(authUrl)
  }

  if (code) {
    const supabase = await createClient()

    try {
      // Exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Error exchanging code for session:', error)
        throw error
      }

      // Get the user to check if we need to create a profile
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error('Error getting user:', userError)
        throw userError
      }

      if (!user) {
        console.error('No user found after confirming email')
        throw new Error('No user found after confirming email')
      }

      console.log('User confirmed email, creating profile if needed:', user.id)

      // Check if the user profile already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected if the profile doesn't exist
        console.error('Error checking for existing profile:', profileError)
      }

      if (!existingProfile) {
        console.log('Creating new user profile for:', user.id)
        // Create a profile if it doesn't exist yet
        const username = user.user_metadata?.username || `user-${user.id.substring(0, 8)}`

        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          username,
          email: user.email,
          total_shuffles: 0,
          shuffle_streak: 0,
          created_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          throw insertError
        }

        console.log('Successfully created user profile for:', user.id)
      } else {
        console.log('User profile already exists for:', user.id)
      }

      // Successful verification, redirect to profile page to ensure user record is verified
      return NextResponse.redirect(new URL(next, request.url))
    } catch (error) {
      // Handle exchange error
      console.error('Session exchange error:', error)
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('error', 'Failed to verify email link. Please try signing in again.')
      return NextResponse.redirect(authUrl)
    }
  }

  // If no code is provided, redirect to auth page
  return NextResponse.redirect(new URL('/auth', request.url))
}
