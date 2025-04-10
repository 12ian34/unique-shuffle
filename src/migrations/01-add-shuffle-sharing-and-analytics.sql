-- Add sharing columns to shuffles table
ALTER TABLE shuffles ADD COLUMN IF NOT EXISTS share_code VARCHAR(20) UNIQUE;
ALTER TABLE shuffles ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Create shuffle analytics table
CREATE TABLE IF NOT EXISTS shuffle_analytics (
  id SERIAL PRIMARY KEY,
  shuffle_id UUID NOT NULL REFERENCES shuffles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'share', 'copy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_shuffle_id ON shuffle_analytics(shuffle_id);
CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_user_id ON shuffle_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_action ON shuffle_analytics(action);
CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_created_at ON shuffle_analytics(created_at);

-- Add RLS policies for shuffle_analytics
ALTER TABLE shuffle_analytics ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own analytics
CREATE POLICY insert_own_analytics ON shuffle_analytics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to read their own analytics or analytics for shuffles they own
CREATE POLICY read_own_analytics ON shuffle_analytics
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    shuffle_id IN (SELECT id FROM shuffles WHERE user_id = auth.uid())
  );

-- Allow admins to read all analytics
CREATE POLICY admin_read_analytics ON shuffle_analytics
  FOR SELECT TO service_role
  USING (true); 