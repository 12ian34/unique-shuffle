-- Add performance indexes for shuffles
CREATE INDEX IF NOT EXISTS idx_shuffles_saved_shared ON public.shuffles(is_saved, is_shared);

-- Add index for faster lookup by share_code
CREATE INDEX IF NOT EXISTS idx_shuffles_share_code ON public.shuffles(share_code) WHERE share_code IS NOT NULL;

-- Add index for faster user shuffle queries
CREATE INDEX IF NOT EXISTS idx_shuffles_user_saved ON public.shuffles(user_id, is_saved);

-- Add index for shuffle analytics
CREATE INDEX IF NOT EXISTS idx_shared_shuffles_views ON public.shared_shuffles(views DESC); 