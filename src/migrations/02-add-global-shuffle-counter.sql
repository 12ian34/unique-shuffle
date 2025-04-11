-- Create global_shuffles table
CREATE TABLE IF NOT EXISTS public.global_shuffles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_global_shuffles_user_id ON global_shuffles(user_id);
CREATE INDEX IF NOT EXISTS idx_global_shuffles_is_saved ON global_shuffles(is_saved);
CREATE INDEX IF NOT EXISTS idx_global_shuffles_created_at ON global_shuffles(created_at);

-- Add RLS policies for global_shuffles
ALTER TABLE global_shuffles ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
ALTER TABLE global_shuffles FORCE ROW LEVEL SECURITY;

-- Anyone can insert shuffle records
CREATE POLICY "Anyone can insert global shuffles"
  ON public.global_shuffles
  FOR INSERT
  WITH CHECK (true);

-- Users can see their own shuffle records
CREATE POLICY "Users can view their own global shuffle records"
  ON public.global_shuffles
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to see all shuffle records
CREATE POLICY "Admins can view all global shuffle records"
  ON public.global_shuffles
  FOR SELECT
  TO service_role
  USING (true);
  
-- Allow service role full access
CREATE POLICY "Service role has full access to global shuffles"
  ON public.global_shuffles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 