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
              background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <svg
                width='60'
                height='60'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4Z'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path d='M9 9H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
                <path d='M9 13H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
              </svg>
              <h1 style={{ fontSize: 60, margin: 0, marginLeft: 16, fontWeight: 800 }}>
                unique shuffle
              </h1>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '20px 40px',
                marginTop: 20,
              }}
            >
              <p style={{ fontSize: 30, textAlign: 'center', margin: 0 }}>
                Shuffle playing cards, discover patterns, earn achievements
              </p>
            </div>
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
              background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <svg
                width='60'
                height='60'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4Z'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path d='M9 9H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
                <path d='M9 13H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
              </svg>
              <h1 style={{ fontSize: 60, margin: 0, marginLeft: 16, fontWeight: 800 }}>
                unique shuffle
              </h1>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '20px 40px',
                marginTop: 20,
              }}
            >
              <p style={{ fontSize: 30, textAlign: 'center', margin: 0 }}>Shuffle not found</p>
            </div>
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

    // Extract first 12 cards for display
    const displayCards = shuffle.cards.slice(0, 12)

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
            background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: 30,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg
                width='50'
                height='50'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4Z'
                  stroke='white'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path d='M9 9H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
                <path d='M9 13H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
              </svg>
              <h1 style={{ fontSize: 50, margin: 0, marginLeft: 16, fontWeight: 800 }}>
                unique shuffle
              </h1>
            </div>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.2)',
                borderRadius: 50,
                padding: '8px 24px',
                fontWeight: 500,
                fontSize: 24,
                color: 'rgb(186, 230, 253)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>shuffled by </span>
              <span style={{ marginLeft: 4, fontWeight: 700 }}>{username}</span>
            </div>
          </div>

          {/* Card display with fancy layout */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                justifyContent: 'center',
                filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))',
              }}
            >
              {displayCards.map((card: string, index: number) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 80,
                    height: 120,
                    background: 'white',
                    borderRadius: 10,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    color: getCardColor(card),
                    fontWeight: 'bold',
                    fontSize: 36,
                    position: 'relative',
                    border: '4px solid white',
                    transform: `rotate(${Math.floor(Math.random() * 5 - 2.5)}deg)`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <div style={{ fontSize: 36, lineHeight: 1 }}>{getCardValue(card)}</div>
                    <div style={{ fontSize: 36, lineHeight: 1, marginTop: 6 }}>
                      {getCardSymbol(card)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom section with patterns and call to action */}
          <div style={{ marginTop: 30 }}>
            {patterns.length > 0 && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  padding: '16px 24px',
                  marginBottom: 20,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Patterns discovered:</h3>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {patterns.slice(0, 4).map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        borderRadius: 50,
                        padding: '4px 16px',
                        fontSize: 20,
                        color: 'rgb(186, 230, 253)',
                        fontWeight: 500,
                      }}
                    >
                      {p.name}
                    </div>
                  ))}
                  {patterns.length > 4 && (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        borderRadius: 50,
                        padding: '4px 16px',
                        fontSize: 20,
                        color: 'rgb(186, 230, 253)',
                        fontWeight: 500,
                      }}
                    >
                      +{patterns.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 50,
                  padding: '8px 24px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  style={{ marginRight: 8 }}
                >
                  <path
                    d='M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56998 17.3333 3.53223 19 5.07183 19Z'
                    stroke='white'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                Visit unique-shuffle.com to view and create your own!
              </div>
            </div>
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
            background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <svg
              width='60'
              height='60'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4Z'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path d='M9 9H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
              <path d='M9 13H15' stroke='white' strokeWidth='2' strokeLinecap='round' />
            </svg>
            <h1 style={{ fontSize: 60, margin: 0, marginLeft: 16, fontWeight: 800 }}>
              unique shuffle
            </h1>
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '20px 40px',
              marginTop: 20,
            }}
          >
            <p style={{ fontSize: 30, textAlign: 'center', margin: 0 }}>
              Shuffle playing cards, discover patterns, earn achievements
            </p>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    )
  }
}
