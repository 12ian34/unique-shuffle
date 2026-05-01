import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShuffleDisplay } from '@/components/shuffle-display'
import { findPatterns } from '@/lib/achievements'
import { formatDate } from '@/lib/utils'
import { BackButton } from '@/components/navigation-buttons'
import { CopyLinkButton } from '@/components/copy-link-button'
import { Metadata, ResolvingMetadata } from 'next'
import { SharedShuffleTracker } from '@/components/shared-shuffle-tracker'
import { db } from '@/lib/db'
import { sharedShuffles, shuffles, userProfiles } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'
import { and, eq, or, sql } from 'drizzle-orm'

export const revalidate = 0

interface PageProps {
  params: Promise<{ code: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findShuffle(code: string) {
  const conditions = uuidRegex.test(code)
    ? or(eq(shuffles.id, code), eq(shuffles.shareCode, code))
    : eq(shuffles.shareCode, code)

  const [shuffle] = await db.select().from(shuffles).where(conditions).limit(1)
  return shuffle || null
}

async function getUsername(userId: string | null) {
  if (!userId) return 'anon'

  const [profile] = await db
    .select({ username: userProfiles.username })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1)

  return profile?.username || 'anon'
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const code = resolvedParams.code
  const shuffle = await findShuffle(code)

  if (!shuffle) {
    return {
      title: 'shared shuffle | unique shuffle',
      description: 'view a shared card shuffle',
    }
  }

  const username = await getUsername(shuffle.userId)
  const patterns = findPatterns(shuffle.cards)
  const patternCount = patterns.length
  const patternNames = patterns.map((p) => p.name)

  let title = `${username}'s shuffle | unique shuffle`
  if (patternCount >= 3) {
    title = `${username} found ${patternCount} patterns! | unique shuffle`
  } else if (patternCount === 1) {
    title = `${username} discovered a ${patternNames[0]}! | unique shuffle`
  } else if (patternCount === 2) {
    title = `${username} found a ${patternNames[0]} and ${patternNames[1]}! | unique shuffle`
  }

  const description =
    patternCount > 0
      ? `${username} discovered ${patternNames.slice(0, 3).join(', ')} in this card shuffle.`
      : `Check out this unique card shuffle by ${username}!`
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og?code=${code}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${code}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Card shuffle by ${username} with ${patternCount} patterns discovered`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function SharedShufflePage({ params }: PageProps) {
  const resolvedParams = await params
  const code = resolvedParams.code

  if (!code) {
    redirect('/')
  }

  const shuffle = await findShuffle(code)

  if (!shuffle) {
    redirect('/shuffle-not-found')
  }

  if (!shuffle.isShared) {
    const user = await getCurrentUser()
    if (!user || user.id !== shuffle.userId) {
      redirect('/shuffle-not-found')
    }
  }

  if (shuffle.isShared) {
    await db
      .insert(sharedShuffles)
      .values({
        shuffleId: shuffle.id,
        views: 0,
        lastViewedAt: new Date().toISOString(),
      })
      .onConflictDoNothing()

    await db
      .update(sharedShuffles)
      .set({
        views: sql`${sharedShuffles.views} + 1`,
        lastViewedAt: new Date().toISOString(),
      })
      .where(eq(sharedShuffles.shuffleId, shuffle.id))
  }

  const [sharedData] = await db
    .select({ views: sharedShuffles.views })
    .from(sharedShuffles)
    .where(eq(sharedShuffles.shuffleId, shuffle.id))
    .limit(1)

  const username = await getUsername(shuffle.userId)
  const patterns = findPatterns(shuffle.cards)

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center'>
        <BackButton />
        {shuffle.shareCode && (
          <CopyLinkButton url={`${process.env.NEXT_PUBLIC_APP_URL}/shared/${shuffle.shareCode}`} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>shared shuffle</CardTitle>
          <CardDescription>
            shuffled by {username} on {formatDate(shuffle.createdAt)}
            {sharedData?.views ? ` • ${sharedData.views} views` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShuffleDisplay deck={shuffle.cards} patterns={patterns} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>patterns found</CardTitle>
          <CardDescription>{patterns.length} patterns discovered in this shuffle</CardDescription>
        </CardHeader>
        <CardContent>
          {patterns.length > 0 ? (
            <div className='grid gap-3 md:grid-cols-2'>
              {patterns.map((pattern) => (
                <div key={pattern.id} className='border rounded-md p-3'>
                  <div className='font-medium'>{pattern.name}</div>
                  <div className='text-sm text-muted-foreground'>{pattern.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground'>No notable patterns found.</div>
          )}
        </CardContent>
      </Card>

      <div className='text-center'>
        <Button asChild>
          <Link href='/'>shuffle your own deck</Link>
        </Button>
      </div>

      <SharedShuffleTracker
        shuffleId={shuffle.id}
        shareCode={shuffle.shareCode || shuffle.id}
        viewCount={sharedData?.views || 0}
        username={username}
        patternCount={patterns.length}
      />
    </div>
  )
}
