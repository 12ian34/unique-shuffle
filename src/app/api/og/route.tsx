import { createClient } from '@/lib/supabase-server'
import { ImageResponse } from 'next/og'
import { findPatterns } from '@/lib/achievements'
import supabaseAdmin from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Image dimensions
const width = 1200
const height = 630

export async function GET(req: NextRequest) {
  try {
    // Get the code from the searchParams
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              fontSize: 40,
              color: 'white',
              background: '#111827',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}
          >
            <h1 style={{ marginBottom: 20 }}>unique shuffle</h1>
            <p style={{ fontSize: 30 }}>
              Shuffle playing cards, discover patterns, earn achievements
            </p>
          </div>
        ),
        {
          width,
          height,
        }
      )
    }

    // Get the shuffle data
    const supabase = await createClient()
    let shuffle = null

    // Try to get shuffle by ID
    let { data: shuffleData } = await supabase.from('shuffles').select('*').eq('id', code).single()

    if (shuffleData) {
      shuffle = shuffleData
    } else {
      // Try by share_code
      const { data: shuffleByShareCode } = await supabase
        .from('shuffles')
        .select('*')
        .eq('share_code', code)
        .single()

      shuffle = shuffleByShareCode
    }

    // If no shuffle found, return default image
    if (!shuffle) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              fontSize: 40,
              color: 'white',
              background: '#111827',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}
          >
            <h1 style={{ marginBottom: 20 }}>unique shuffle</h1>
            <p style={{ fontSize: 30 }}>Shuffle not found</p>
          </div>
        ),
        {
          width,
          height,
        }
      )
    }

    // Get username if available
    let username = 'anon'
    if (shuffle?.user_id) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', shuffle.user_id)
        .single()

      if (userData?.username) {
        username = userData.username
      }
    }

    // Find patterns in the shuffle
    const patterns = findPatterns(shuffle.cards)

    // Extract first 10 cards for display
    const displayCards = shuffle.cards.slice(0, 10)

    // Helper function to get card symbol
    const getCardSymbol = (card: string) => {
      const suit = card.slice(-1)
      switch (suit) {
        case 'H':
          return '♥'
        case 'D':
          return '♦'
        case 'C':
          return '♣'
        case 'S':
          return '♠'
        default:
          return ''
      }
    }

    // Helper function to get card color
    const getCardColor = (card: string) => {
      const suit = card.slice(-1)
      return suit === 'H' || suit === 'D' ? '#ef4444' : '#000000'
    }

    // Helper function to get card value
    const getCardValue = (card: string) => {
      const value = card.slice(0, -1)
      switch (value) {
        case 'A':
          return 'A'
        case 'K':
          return 'K'
        case 'Q':
          return 'Q'
        case 'J':
          return 'J'
        case 'T':
          return '10'
        default:
          return value
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: 'white',
            background: '#111827',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 60 }}>unique shuffle</h1>
            <h2 style={{ margin: 0, fontSize: 40, marginTop: 10 }}>
              {username !== 'Anonymous' ? `Shuffled by ${username}` : 'Saved Shuffle'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
            {displayCards.map((card: string, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 100,
                  height: 140,
                  background: 'white',
                  borderRadius: 10,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  color: getCardColor(card),
                  fontWeight: 'bold',
                  fontSize: 50,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div>{getCardValue(card)}</div>
                  <div>{getCardSymbol(card)}</div>
                </div>
              </div>
            ))}
          </div>

          {patterns.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 30 }}>Patterns found:</h3>
              <p style={{ margin: 0, fontSize: 24 }}>
                {patterns
                  .slice(0, 3)
                  .map((p) => p.name)
                  .join(', ')}
                {patterns.length > 3 && '...'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', fontSize: 28, marginTop: 30 }}>
            View the full shuffle at unique-shuffle.com
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)

    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: 'white',
            background: '#111827',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          }}
        >
          <h1 style={{ marginBottom: 20 }}>unique shuffle</h1>
          <p style={{ fontSize: 30 }}>
            Shuffle playing cards, discover patterns, earn achievements
          </p>
        </div>
      ),
      {
        width,
        height,
      }
    )
  }
}
