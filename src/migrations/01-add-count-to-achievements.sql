-- The count column already exists, so we'll just modify the constraints

-- Update the unique constraint to handle multiple achievements of the same type per user
ALTER TABLE public.achievements DROP CONSTRAINT IF EXISTS achievements_user_id_achievement_id_key;

-- Unique achievements are unique by user, achievement_id, and shuffle_id 
-- This allows multiple achievements of the same type from different shuffles
-- and prevents duplicate achievements from the same shuffle
ALTER TABLE public.achievements ADD CONSTRAINT achievements_user_achievement_shuffle_unique 
  UNIQUE (user_id, achievement_id, shuffle_id); 