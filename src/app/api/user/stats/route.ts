import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card as CardType, UserStats, Shuffle } from '@/types'
import { generateUsername } from '@/utils/username-generator'

// Cache user stats to prevent excessive database queries
const statsCache = new Map<string, { data: UserStats; timestamp: number }>()
const CACHE_DURATION = 60000 // 60 seconds (1 minute)

// Track most recent API call by user to enforce limits on API calls
const lastUserRequests = new Map<string, number>()
const MIN_REQUEST_INTERVAL = 5000 // 5 seconds between non-forced requests

// Store currently running database queries as regular promises of data
// NOT as response promises - this is what was causing the stream errors
const pendingDataQueries = new Map<
  string,
  {
    promise: Promise<UserStats>
    timestamp: number
  }
>()
const REQUEST_WINDOW = 3000 // 3 second window for deduplication

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const supabaseAdmin = createSupabaseAdmin()

    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data.user) {
      console.log('No authenticated user found for stats')
      return NextResponse.json(
        { stats: null, message: 'No authenticated user' },
        { status: 200 } // Return 200 even for no user to prevent errors
      )
    }

    const userId = data.user.id

    // Get current time for logging and timing
    const now = Date.now()
    const url = new URL(request.url)
    const timestamp = url.searchParams.get('timestamp')
    const forceFresh = !!timestamp

    // Apply rate limiting unless we're forcing a refresh
    if (!forceFresh && lastUserRequests.has(userId)) {
      const lastRequestTime = lastUserRequests.get(userId)!

      // If a request was made too recently, return cached data or error
      if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        console.log(
          `Rate limiting request for user ${userId} - too frequent (${
            now - lastRequestTime
          }ms since last request)`
        )

        // If we have cached data, return it instead of an error
        if (statsCache.has(userId)) {
          const cached = statsCache.get(userId)!
          return NextResponse.json({
            stats: cached.data,
            fromCache: true,
            rateLimited: true,
            lastUpdate: cached.timestamp,
          })
        }

        // Otherwise return a 429 (too many requests)
        return NextResponse.json(
          {
            error: 'Too many requests',
            retryAfter: MIN_REQUEST_INTERVAL - (now - lastRequestTime),
          },
          { status: 429 }
        )
      }
    }

    // Update the last request time for this user - do this for all requests
    lastUserRequests.set(userId, now)

    // Log request for debugging
    console.log(
      `Received stats request for user ${userId} at ${now}${
        timestamp ? ` with timestamp ${timestamp}` : ''
      }`
    )

    // Check cache first (unless force refresh is set)
    if (!forceFresh && statsCache.has(userId)) {
      const cached = statsCache.get(userId)!
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log(
          `Using cached stats for user ${userId} from ${cached.timestamp} (${
            now - cached.timestamp
          }ms old)`
        )
        return NextResponse.json({
          stats: cached.data,
          fromCache: true,
          lastUpdate: cached.timestamp,
        })
      }
    }

    // Check if we have a pending query for this user
    let userStatsPromise: Promise<UserStats>

    if (pendingDataQueries.has(userId)) {
      const pendingQuery = pendingDataQueries.get(userId)!

      // If there's a query in progress that started within the window, reuse that promise
      if (now - pendingQuery.timestamp < REQUEST_WINDOW) {
        console.log(
          `Reusing in-flight query for user ${userId} from ${pendingQuery.timestamp} (${
            now - pendingQuery.timestamp
          }ms ago)`
        )
        userStatsPromise = pendingQuery.promise
      } else {
        // Window expired, start a new query
        userStatsPromise = fetchUserStats(userId, forceFresh, supabaseAdmin, now)
        pendingDataQueries.set(userId, { promise: userStatsPromise, timestamp: now })
      }
    } else {
      // No pending query, start a new one
      userStatsPromise = fetchUserStats(userId, forceFresh, supabaseAdmin, now)
      pendingDataQueries.set(userId, { promise: userStatsPromise, timestamp: now })
    }

    try {
      // Await the data separately from the response generation
      const stats = await userStatsPromise

      // Then create a fresh response with the data
      return NextResponse.json({ stats })
    } catch (error) {
      console.error('Error processing user stats:', error)
      return NextResponse.json(
        { error: 'Failed to load user stats', message: (error as Error).message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Unexpected error fetching user stats:', error)
    return NextResponse.json(
      { stats: null, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Separate function to actually fetch the data (returns a UserStats object, not a Response)
async function fetchUserStats(
  userId: string,
  forceFresh: boolean,
  supabaseAdmin: any,
  timestamp: number
): Promise<UserStats> {
  try {
    // Log the actual database query
    console.log(`Performing database query for user ${userId} at ${timestamp}`)

    // Get direct count of user's shuffles from global_shuffles table
    const { count: directShufflesCount, error: directCountError } = await supabaseAdmin
      .from('global_shuffles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (directCountError) {
      console.error('Error getting direct shuffle count:', directCountError)
      throw new Error(directCountError.message)
    } else {
      console.log(`Direct database count for user ${userId}: ${directShufflesCount} shuffles`)
    }

    // Try to get stats from leaderboard first (faster)
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('total_shuffles, shuffle_streak, achievements_count')
      .eq('user_id', userId)
      .single()

    if (!leaderboardError && leaderboardData) {
      console.log(`Leaderboard data for user ${userId}: ${leaderboardData.total_shuffles} shuffles`)

      // If we're forcing a fresh count or counts are inconsistent, update leaderboard with direct count
      if (
        (forceFresh ||
          (directShufflesCount !== null &&
            leaderboardData.total_shuffles !== directShufflesCount)) &&
        directShufflesCount !== null
      ) {
        // Only log update when the counts actually differ
        if (leaderboardData.total_shuffles !== directShufflesCount) {
          console.log(
            `Updating leaderboard with direct count: ${directShufflesCount} (was: ${leaderboardData.total_shuffles})`
          )
        }

        // Update leaderboard with accurate count
        const { error: updateError } = await supabaseAdmin
          .from('leaderboard')
          .update({
            total_shuffles: directShufflesCount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Failed to update leaderboard with accurate count:', updateError)
        } else {
          // Update our reference to reflect the direct count
          leaderboardData.total_shuffles = directShufflesCount
        }
      }

      // Get most common cards as a separate query
      const { data: shuffles } = await supabaseAdmin
        .from('global_shuffles')
        .select('cards')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20) // Limit to recent shuffles for optimization

      // Calculate most common cards
      const cardCounts = new Map<string, { card: CardType; count: number }>()

      if (shuffles) {
        shuffles.forEach((shuffle: { cards: any[] }) => {
          if (!shuffle.cards || !Array.isArray(shuffle.cards)) return

          shuffle.cards.forEach((card: any) => {
            if (!card || !card.suit || !card.value) return

            const key = `${card.value}-${card.suit}`
            if (!cardCounts.has(key)) {
              cardCounts.set(key, { card, count: 0 })
            }

            const entry = cardCounts.get(key)!
            entry.count++
            cardCounts.set(key, entry)
          })
        })
      }

      // Get top 10 cards
      const mostCommonCards = Array.from(cardCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Create stats from leaderboard data
      const stats: UserStats = {
        total_shuffles: leaderboardData.total_shuffles || 0,
        shuffle_streak: leaderboardData.shuffle_streak || 0,
        achievements_count: leaderboardData.achievements_count || 0,
        most_common_cards: mostCommonCards,
      }

      console.log(`User stats for ${userId}: total_shuffles=${stats.total_shuffles}`)

      // Cache the result
      statsCache.set(userId, { data: stats, timestamp })

      // Clean up the pending promise
      setTimeout(() => {
        const currentPending = pendingDataQueries.get(userId)
        if (currentPending && currentPending.timestamp <= timestamp) {
          pendingDataQueries.delete(userId)
        }
      }, REQUEST_WINDOW)

      return stats
    }

    // Fallback to default stats if no data available
    const emptyStats: UserStats = {
      total_shuffles: 0,
      shuffle_streak: 0,
      achievements_count: 0,
      most_common_cards: [],
    }

    return emptyStats
  } catch (error) {
    // Make sure to clean up the pending query on error
    setTimeout(() => {
      const currentPending = pendingDataQueries.get(userId)
      if (currentPending && currentPending.timestamp <= timestamp) {
        pendingDataQueries.delete(userId)
      }
    }, 0)

    throw error
  }
}

export async function POST(request: Request) {
  const { userId, forceRecalculate } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabaseAdmin = createSupabaseAdmin()

  try {
    // Clear the cache for this user to ensure fresh data on next GET
    statsCache.delete(userId)

    // Get user shuffles count from database - count all shuffles, not just saved
    const { count: shufflesCount, error: shufflesError } = await supabaseAdmin
      .from('global_shuffles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    // Don't filter by is_saved - count all shuffles for stats

    if (shufflesError) {
      console.error('Error counting shuffles:', shufflesError)
      return NextResponse.json({ error: shufflesError.message }, { status: 400 })
    }

    console.log(`POST /api/user/stats: User ${userId} has ${shufflesCount} total shuffles`)

    // Get current leaderboard data
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (leaderboardError && leaderboardError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error fetching leaderboard data:', leaderboardError)
      return NextResponse.json({ error: leaderboardError.message }, { status: 400 })
    }

    // Force recalculate streak if requested
    let streak = leaderboardData?.shuffle_streak || 0
    if (forceRecalculate) {
      // This will fetch shuffles and recalculate the streak
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/user/stats?userId=${userId}`)
      if (response.ok) {
        const stats = await response.json()
        streak = stats.shuffle_streak
      }
    }

    // If leaderboard entry exists, update it
    if (leaderboardData) {
      console.log(
        `Updating leaderboard for user ${userId}: ${
          leaderboardData.total_shuffles || 0
        } -> ${shufflesCount} shuffles`
      )

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('leaderboard')
        .update({
          total_shuffles: shufflesCount,
          shuffle_streak: streak,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()

      if (updateError) {
        console.error('Error updating leaderboard:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    } else {
      // Create new leaderboard entry
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        return NextResponse.json({ error: userError.message }, { status: 400 })
      }

      console.log(
        `Creating new leaderboard entry for user ${userId} with ${shufflesCount} shuffles`
      )

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('leaderboard')
        .insert([
          {
            user_id: userId,
            username: userData.email?.split('@')[0] || generateUsername(userId),
            total_shuffles: shufflesCount,
            shuffle_streak: streak,
            achievements_count: 0,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (insertError) {
        console.error('Error creating leaderboard entry:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }

    // Trigger achievements update
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const achievementResponse = await fetch(`${baseUrl}/api/achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!achievementResponse.ok) {
        console.error('Achievement update failed with status:', achievementResponse.status)
      }
    } catch (achievementError) {
      console.error('Failed to update achievements:', achievementError)
    }

    return NextResponse.json({
      success: true,
      shuffles: shufflesCount,
      streak: streak,
    })
  } catch (error) {
    console.error('Unexpected error updating user stats:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
