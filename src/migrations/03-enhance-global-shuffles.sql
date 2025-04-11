-- Add cards column to global_shuffles table
ALTER TABLE public.global_shuffles 
ADD COLUMN IF NOT EXISTS cards JSONB;

-- Update existing records to have an empty array for cards
UPDATE public.global_shuffles 
SET cards = '[]'::jsonb 
WHERE cards IS NULL;

-- Make cards NOT NULL after updating existing records
ALTER TABLE public.global_shuffles 
ALTER COLUMN cards SET NOT NULL;

-- Add share_code and is_shared columns for consistency with previous shuffles table
ALTER TABLE public.global_shuffles 
ADD COLUMN IF NOT EXISTS share_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Add index for cards to improve query performance for card-based searches
CREATE INDEX IF NOT EXISTS idx_global_shuffles_cards ON global_shuffles USING GIN (cards);

-- Add index for share_code for quick lookups
CREATE INDEX IF NOT EXISTS idx_global_shuffles_share_code ON global_shuffles(share_code);

-- Create a view that mimics the old shuffles table for backward compatibility
CREATE OR REPLACE VIEW public.shuffles_view AS
SELECT 
  id,
  user_id,
  cards,
  created_at,
  share_code,
  is_shared
FROM 
  public.global_shuffles
WHERE 
  is_saved = TRUE;

-- Set appropriate RLS policies on the view 
ALTER VIEW public.shuffles_view OWNER TO postgres;
GRANT SELECT ON public.shuffles_view TO anon, authenticated, service_role;

-- Add comment documenting the migration
COMMENT ON TABLE public.global_shuffles IS 'Unified table for all shuffles (both saved and unsaved), replacing the separate shuffles table'; 