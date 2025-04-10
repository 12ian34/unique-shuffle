const { createSupabaseAdmin } = require('../../adapters/supabase-admin')

/**
 * Test utility for checking and fixing database constraints
 * This should only be used during development/testing
 */
async function checkAndFixConstraints(userId) {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // 1. Check if user exists in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authData.user) {
      return {
        error: 'User not found in auth.users',
        userId,
        authError: authError?.message || null,
        status: 'error',
      }
    }

    // 2. Check for existing rows in shuffles table
    const { data: shufflesData, error: shufflesError } = await supabaseAdmin
      .from('shuffles')
      .select('count')
      .eq('user_id', userId)
      .single()

    // 3. Check for existing rows in leaderboard table
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 4. If leaderboard entry doesn't exist, create it
    let leaderboardResult = null
    if (leaderboardError && leaderboardError.code === 'PGRST116') {
      // Record not found
      const { data, error } = await supabaseAdmin
        .from('leaderboard')
        .insert({
          user_id: userId,
          username: `User_${userId.substring(0, 8)}`,
          total_shuffles: 0,
          shuffle_streak: 0,
          achievements_count: 0,
          updated_at: new Date().toISOString(),
        })
        .select()

      leaderboardResult = { inserted: true, error: error?.message || null }
    } else {
      leaderboardResult = { exists: true, data: leaderboardData }
    }

    // Return diagnosis
    return {
      userId,
      authUser: {
        exists: true,
        email: authData.user.email,
        id: authData.user.id,
      },
      shuffles: {
        count: shufflesData?.count || 0,
        error: shufflesError?.message || null,
      },
      leaderboard: leaderboardResult,
      status: 'success',
    }
  } catch (error) {
    console.error('Error diagnosing constraints:', error)
    return {
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

module.exports = { checkAndFixConstraints }
