const { createSupabaseAdmin } = require('../../adapters/supabase-admin')

/**
 * Test utility for inserting test shuffles
 * This should only be used during development/testing
 */
async function testInsertShuffle(userId) {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    // 1. First check if user exists in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authData.user) {
      return {
        error: 'User not found in auth.users. Foreign key constraint would fail.',
        userId,
        status: 'error',
      }
    }

    // 2. Check if leaderboard entry exists, if not create it
    const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (leaderboardError && leaderboardError.code === 'PGRST116') {
      // Record not found
      await supabaseAdmin.from('leaderboard').insert({
        user_id: userId,
        username: `User_${userId.substring(0, 8)}`,
        total_shuffles: 0,
        shuffle_streak: 0,
        achievements_count: 0,
        updated_at: new Date().toISOString(),
      })
    }

    // 3. Create a test shuffle with the current user ID
    const testCards = [
      { suit: 'hearts', value: 'A' },
      { suit: 'spades', value: 'K' },
      { suit: 'diamonds', value: 'Q' },
    ]

    const { data, error } = await supabaseAdmin
      .from('global_shuffles')
      .insert([
        {
          user_id: userId,
          cards: testCards,
          is_saved: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return {
        error: error.message,
        status: 'error',
        errorCode: error.code,
        hint: error.hint || null,
      }
    }

    // 4. Update leaderboard
    const { error: updateError } = await supabaseAdmin
      .from('leaderboard')
      .update({
        total_shuffles: leaderboardData ? leaderboardData.total_shuffles + 1 : 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return {
      status: 'success',
      shuffleInserted: true,
      leaderboardUpdated: !updateError,
      data,
      userId,
    }
  } catch (error) {
    console.error('Error in test insert:', error)
    return {
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

module.exports = { testInsertShuffle }
