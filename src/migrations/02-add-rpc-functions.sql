-- Add RPC functions for the application

-- Function to increment shared shuffle views atomically
CREATE OR REPLACE FUNCTION increment_shared_shuffle_views(shuffle_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_shuffles
  SET 
    views = views + 1,
    last_viewed_at = now()
  WHERE shuffle_id = shuffle_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 