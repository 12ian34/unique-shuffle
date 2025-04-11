-- Migrate existing data from shuffles to global_shuffles

-- First, preserve the original UUID from the shuffles table
-- Add a column to global_shuffles to store the original UUID
ALTER TABLE public.global_shuffles 
ADD COLUMN IF NOT EXISTS original_shuffle_id UUID;

-- Copy data from shuffles to global_shuffles
INSERT INTO public.global_shuffles (
  user_id, 
  cards, 
  created_at, 
  is_saved, 
  share_code, 
  is_shared,
  original_shuffle_id  -- Store the original UUID
)
SELECT 
  user_id, 
  cards, 
  created_at, 
  TRUE as is_saved,  -- Mark all existing shuffles as saved
  share_code, 
  COALESCE(is_shared, FALSE) as is_shared,
  id as original_shuffle_id  -- Keep track of the original UUID
FROM 
  public.shuffles
WHERE
  -- Avoid inserting if a record with the same data already exists (for idempotency)
  NOT EXISTS (
    SELECT 1 FROM public.global_shuffles 
    WHERE 
      user_id = shuffles.user_id AND 
      created_at = shuffles.created_at AND
      (cards::text = shuffles.cards::text)
  );

-- Create a modified version of the shuffle_analytics table that can work with integer IDs
CREATE TABLE IF NOT EXISTS public.shuffle_analytics_new (
  id SERIAL PRIMARY KEY,
  shuffle_id INTEGER NOT NULL REFERENCES global_shuffles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'share', 'copy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Copy existing analytics data to the new table, using the original_shuffle_id to match
INSERT INTO public.shuffle_analytics_new (
  shuffle_id,
  user_id,
  action,
  created_at,
  metadata
)
SELECT 
  g.id,  -- Integer ID from global_shuffles
  a.user_id,
  a.action,
  a.created_at,
  a.metadata
FROM public.shuffle_analytics a
JOIN public.global_shuffles g ON g.original_shuffle_id = a.shuffle_id;

-- Check how many records were migrated from analytics
SELECT 
  (SELECT COUNT(*) FROM public.shuffle_analytics) as original_analytics_count,
  (SELECT COUNT(*) FROM public.shuffle_analytics_new) as new_analytics_count;

-- Once you've verified the migration worked, you can rename the tables:
-- DROP TABLE public.shuffle_analytics;
-- ALTER TABLE public.shuffle_analytics_new RENAME TO shuffle_analytics;

-- Count how many records were migrated for verification
SELECT COUNT(*) FROM public.global_shuffles WHERE is_saved = TRUE; 