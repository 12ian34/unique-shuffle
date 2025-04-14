import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { findPatterns } from '@/lib/achievements'
import supabaseAdmin from '@/lib/supabase-admin'
import { formatDate } from '@/lib/utils'
import { BackButton } from '@/components/navigation-buttons'

export const revalidate = 0 // No caching for shared shuffle pages

// Define the correct type for Next.js page props
interface PageProps {
  params: Promise<{ code: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SharedShufflePage({ params }: PageProps) {
  let code: string

  try {
    console.log('Received params:', params)
    const paramsData = await params
    console.log('Awaited params data:', paramsData)
    code = paramsData.code
    console.log('Extracted code:', code)

    if (!code) {
      console.error('Missing code parameter')
      redirect('/')
    }
  } catch (err) {
    console.error('Error extracting code parameter:', err)
    redirect('/')
  }

  // Get the shuffle by share code or ID
  const supabase = await createClient()
  console.log('Attempting to fetch shuffle with code:', code)

  // Initialize variables
  let shuffle: any = null
  let error: any = null

  // If we haven't found it yet, try the normal approach
  if (!shuffle) {
    // First try finding by ID without restrictions
    let { data: shuffleData, error: queryError } = await supabase
      .from('shuffles')
      .select('*')
      .eq('id', code)
      .single()

    shuffle = shuffleData
    error = queryError

    // Show detailed error for debugging
    if (error) {
      console.log('Error finding by ID:', error)

      // Diagnostic query to see if shuffle exists at all
      const { count } = await supabase
        .from('shuffles')
        .select('*', { count: 'exact', head: true })
        .eq('id', code)

      console.log(`Database has ${count || 0} shuffles with this ID`)
    }
  }

  // If not found by ID, try by share_code without restrictions
  if (error || !shuffle) {
    console.log('Not found by id, trying by share_code')
    const { data: shuffleByShareCode, error: shareCodeError } = await supabase
      .from('shuffles')
      .select('*')
      .eq('share_code', code)
      .single()

    if (shareCodeError || !shuffleByShareCode) {
      console.error('Shuffle not found by share_code either:', shareCodeError)

      // Use redirect to a dedicated error page without client-side handlers
      redirect('/shuffle-not-found')
    }

    shuffle = shuffleByShareCode
    error = null
  }

  console.log('Fetch result:', {
    shuffleFound: !!shuffle,
    shuffleId: shuffle?.id,
    isSaved: shuffle?.is_saved,
    isShared: shuffle?.is_shared,
    shareCode: shuffle?.share_code,
  })

  // Check if the shuffle should be viewable
  if (shuffle) {
    // For shuffle by ID, it must be saved
    if (code === shuffle.id && !shuffle.is_saved) {
      console.log('Found shuffle by ID but it is not saved')
    }

    // For shuffle by share_code, it must be shared
    if (code === shuffle.share_code && !shuffle.is_shared) {
      console.log('Found shuffle by share_code but it is not shared')
    }
  }

  if (error || !shuffle) {
    console.error('Shuffle not found or error occurred:', error)
    // Redirect to home if shuffle not found
    redirect('/')
  }

  // Increment the view count
  await supabaseAdmin.from('shared_shuffles').upsert(
    {
      shuffle_id: shuffle.id,
      views: 1, // Will be incremented by the function
      last_viewed_at: new Date().toISOString(),
    },
    {
      onConflict: 'shuffle_id',
    }
  )

  await supabaseAdmin.rpc('increment_shared_shuffle_views', {
    shuffle_id_param: shuffle.id,
  })

  // Get current view count
  const { data: sharedData } = await supabase
    .from('shared_shuffles')
    .select('views')
    .eq('shuffle_id', shuffle.id)
    .single()

  const viewCount = sharedData?.views || 0

  // Find patterns in the shuffle
  const patterns = findPatterns(shuffle.cards)

  // Log detailed shuffle info for debugging
  console.log('Shuffle details:', {
    id: shuffle.id,
    user_id: shuffle.user_id,
    created_at: shuffle.created_at,
    is_saved: shuffle.is_saved,
    is_shared: shuffle.is_shared,
  })

  // Get username separately if needed
  let username = 'Anonymous'
  if (shuffle?.user_id) {
    console.log('Looking up username for user_id:', shuffle.user_id)

    try {
      // Try with admin client first for better permissions
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', shuffle.user_id)
        .single()

      console.log('Username lookup result:', {
        found: !!userData,
        username: userData?.username,
        error: userError,
      })

      if (userData?.username) {
        username = userData.username
      } else if (userError) {
        console.error('Error fetching username:', userError)
      }
    } catch (e) {
      console.error('Exception during username lookup:', e)
    }
  } else {
    console.log('Cannot lookup username - user_id is missing from shuffle:', shuffle)

    // Try to get the current authenticated user as a fallback
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('Using current authenticated user as fallback')
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
          } else {
            console.log('Fixed missing user_id on shuffle')
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
