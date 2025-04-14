import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { findPatterns } from '@/lib/achievements'
import supabaseAdmin from '@/lib/supabase-admin'
import { formatDate } from '@/lib/utils'
import { BackButton } from '@/components/navigation-buttons'
import { PostgrestError } from '@supabase/supabase-js'
import { CopyLinkButton } from '@/components/copy-link-button'

export const revalidate = 0 // No caching for shared shuffle pages

// Define the correct type for Next.js page props
interface PageProps {
  params: Promise<{ code: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SharedShufflePage({ params }: PageProps) {
  let code: string

  try {
    const paramsData = await params
    code = paramsData.code

    if (!code) {
      redirect('/')
    }
  } catch (err) {
    console.error('Error extracting code parameter:', err)
    redirect('/')
  }

  // Get the shuffle by share code or ID
  const supabase = await createClient()

  // Try the verification API first for diagnostics
  try {
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/shuffle/verify?code=${code}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json()

      // If the API tells us the shuffle doesn't exist, redirect
      if (!verifyData.exists) {
        // Redirect to not found page with detailed diagnostics
        redirect('/shuffle-not-found')
      }
    }
  } catch (error) {
    console.error('Error using verification API:', error)
    // Continue with regular approach if API fails
  }

  // Initialize variables
  let shuffle: any = null
  let error: any = null
  let detailedDiagnostics = {
    byId: { attempted: false, found: false, error: null as PostgrestError | null },
    byShareCode: { attempted: false, found: false, error: null as PostgrestError | null },
    countCheck: { attempted: false, count: 0 },
  }

  // First try finding by ID without restrictions
  detailedDiagnostics.byId.attempted = true
  let { data: shuffleData, error: queryError } = await supabase
    .from('shuffles')
    .select('*')
    .eq('id', code)
    .single()

  shuffle = shuffleData
  error = queryError
  detailedDiagnostics.byId.found = !!shuffleData
  detailedDiagnostics.byId.error = queryError

  // Show detailed error for debugging
  if (error) {
    // Diagnostic query to see if shuffle exists at all
    detailedDiagnostics.countCheck.attempted = true
    const { count } = await supabase
      .from('shuffles')
      .select('*', { count: 'exact', head: true })
      .eq('id', code)

    detailedDiagnostics.countCheck.count = count || 0
  }

  // If not found by ID, try by share_code without restrictions
  if (error || !shuffle) {
    detailedDiagnostics.byShareCode.attempted = true
    const { data: shuffleByShareCode, error: shareCodeError } = await supabase
      .from('shuffles')
      .select('*')
      .eq('share_code', code)
      .single()

    detailedDiagnostics.byShareCode.found = !!shuffleByShareCode
    detailedDiagnostics.byShareCode.error = shareCodeError

    if (shareCodeError || !shuffleByShareCode) {
      console.error('Shuffle not found by share_code either:', shareCodeError)

      // Check if the code looks like a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isUuid = uuidRegex.test(code)

      // Additional diagnostic query - check if ANY shuffles exist
      const { count: totalShuffles } = await supabase
        .from('shuffles')
        .select('*', { count: 'exact', head: true })

      // Check if any shuffles have share_codes set
      const { count: shufflesWithShareCodes } = await supabase
        .from('shuffles')
        .select('*', { count: 'exact', head: true })
        .not('share_code', 'is', null)

      // Use redirect to a dedicated error page without client-side handlers
      redirect('/shuffle-not-found')
    }

    shuffle = shuffleByShareCode
    error = null
  }

  // Check if the shuffle should be viewable
  if (shuffle) {
    // For shuffle by ID, it must be either saved by this user or shared
    if (code === shuffle.id && !shuffle.is_shared) {
      // Get the current authenticated user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If not shared, only allow access if this is the user's own shuffle
      if (!session?.user || session.user.id !== shuffle.user_id) {
        redirect('/shuffle-not-found')
      }
    }

    // For shuffle by share_code, it must be shared
    if (code === shuffle.share_code && !shuffle.is_shared) {
      redirect('/shuffle-not-found')
    }
  }

  if (error || !shuffle) {
    console.error('Shuffle not found or error occurred:', error)
    // Redirect to home if shuffle not found
    redirect('/')
  }

  // Increment the view count using a single atomic operation
  try {
    // First ensure the shared_shuffles record exists
    await supabaseAdmin.from('shared_shuffles').upsert(
      {
        shuffle_id: shuffle.id,
        views: 0, // This will only be used for new records
        last_viewed_at: new Date().toISOString(),
      },
      {
        onConflict: 'shuffle_id',
        ignoreDuplicates: true, // Don't update anything if the record exists
      }
    )

    // Then call the RPC function to atomically increment the counter
    await supabaseAdmin.rpc('increment_shared_shuffle_views', {
      shuffle_id_param: shuffle.id,
    })
  } catch (viewError) {
    // Non-critical error - log but continue
    console.error('Error incrementing view count:', viewError)
  }

  // Get current view count
  const { data: sharedData } = await supabase
    .from('shared_shuffles')
    .select('views')
    .eq('shuffle_id', shuffle.id)
    .single()

  const viewCount = sharedData?.views || 0

  // Find patterns in the shuffle
  const patterns = findPatterns(shuffle.cards)

  // Get username separately if needed
  let username = 'Anonymous'
  if (shuffle?.user_id) {
    try {
      // Try with admin client first for better permissions
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', shuffle.user_id)
        .single()

      if (userData?.username) {
        username = userData.username
      } else if (userError) {
        console.error('Error fetching username:', userError)
      }
    } catch (e) {
      console.error('Exception during username lookup:', e)
    }
  } else {
    // Try to get the current authenticated user as a fallback
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single()

        if (userData?.username) {
          username = userData.username

          // Update the shuffle with the correct user_id
          const { error: updateError } = await supabaseAdmin
            .from('shuffles')
            .update({ user_id: session.user.id })
            .eq('id', shuffle.id)

          if (updateError) {
            console.error('Error fixing shuffle user_id:', updateError)
          }
        }
      }
    } catch (e) {
      console.error('Error getting current user session:', e)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Shared Shuffle</h1>
        <p className='mt-4 text-muted-foreground'>View a shared card shuffle</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {username !== 'Anonymous' ? `Shuffled by ${username}` : 'Saved Shuffle'}
          </CardTitle>
          <CardDescription>
            Shared on {formatDate(shuffle.created_at)} • {viewCount} views
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-6'>
            {shuffle.created_at
              ? `Shuffled on ${new Date(shuffle.created_at).toLocaleDateString()}`
              : 'Shuffle date unknown'}
          </p>

          <ShuffleDisplay deck={shuffle.cards} patterns={patterns} />

          <div className='mt-8 flex justify-center'>
            <BackButton />
            <CopyLinkButton url={`${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/${code}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
