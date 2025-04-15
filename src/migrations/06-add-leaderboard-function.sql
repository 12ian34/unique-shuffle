CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 100)
RETURNS TABLE(
  "userId" uuid,
  username text,
  "totalShuffles" integer,
  "achievementCount" bigint, -- Use bigint for count results
  "shuffleStreak" integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    u.id AS "userId",
    u.username,
    u.total_shuffles AS "totalShuffles",
    COUNT(DISTINCT a.achievement_id)::bigint AS "achievementCount", -- Cast count to bigint
    u.shuffle_streak AS "shuffleStreak"
  FROM
    public.users u
  LEFT JOIN
    public.achievements a ON u.id = a.user_id
  GROUP BY
    u.id, u.username, u.total_shuffles, u.shuffle_streak
  ORDER BY
    "totalShuffles" DESC NULLS LAST -- Default order by total shuffles
  LIMIT
    limit_count;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
-- Grant execute permission to the anon role if needed (e.g., for public leaderboards)
-- GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon;