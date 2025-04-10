-- Rename unique_cards_count column to shuffle_streak
ALTER TABLE public.leaderboard 
RENAME COLUMN unique_cards_count TO shuffle_streak;

-- Update any default value or constraints if needed
COMMENT ON COLUMN public.leaderboard.shuffle_streak IS 'Number of consecutive days with at least one shuffle'; 