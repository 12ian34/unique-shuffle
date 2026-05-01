import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { publicSharedShuffles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { findPatterns } from '@/lib/achievements'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  let title = 'unique shuffle'
  let subtitle = 'shuffle a 52-card deck and discover unlikely patterns'

  if (code) {
    try {
      const [sharedShuffle] = await db
        .select()
        .from(publicSharedShuffles)
        .where(eq(publicSharedShuffles.shareCode, code))
        .limit(1)

      if (sharedShuffle) {
        const patterns = findPatterns(sharedShuffle.cards)
        title = `${sharedShuffle.displayName || 'anon'}'s shuffle`
        subtitle =
          patterns.length > 0
            ? `${patterns.length} patterns discovered`
            : 'a probably unique 52-card shuffle'
      }
    } catch {
      // Fall back to generic OG copy if the database is unavailable.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111827, #4c1d95)',
          color: 'white',
          padding: 80,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 24 }}>{title}</div>
        <div style={{ fontSize: 36, opacity: 0.86 }}>{subtitle}</div>
        <div style={{ fontSize: 28, opacity: 0.7, marginTop: 64 }}>unique-shuffle.netlify.app</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
