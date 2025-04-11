-- Create user_achievements table for pattern-based achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  shuffle_id INTEGER REFERENCES global_shuffles(id) ON DELETE SET NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can only earn a specific achievement once
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_shuffle_id ON user_achievements(shuffle_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achieved_at ON user_achievements(achieved_at);

-- Add RLS policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own achievements
CREATE POLICY read_own_achievements ON user_achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own achievements (though this is primarily done by the backend)
CREATE POLICY insert_own_achievements ON user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow service role to read and write all achievements
CREATE POLICY admin_read_achievements ON user_achievements
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY admin_insert_achievements ON user_achievements
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY admin_update_achievements ON user_achievements
  FOR UPDATE TO service_role
  USING (true);

-- Modify achievements API to use the table for pattern-based checks
COMMENT ON TABLE user_achievements IS 'Stores achievements earned by users through pattern matching and specific conditions';

-- Create function to get all achievements for a user
CREATE OR REPLACE FUNCTION get_user_achievements(user_uuid UUID)
RETURNS TABLE (
  achievement_id VARCHAR,
  achieved_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT achievement_id, achieved_at 
  FROM user_achievements
  WHERE user_id = user_uuid
  ORDER BY achieved_at ASC;
$$; 