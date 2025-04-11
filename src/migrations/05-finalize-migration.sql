-- Finalize the migration by dropping old tables and setting up the new structure

-- First, check that the migration was successful by comparing counts
DO $$
DECLARE
  shuffles_count INTEGER;
  global_saved_count INTEGER;
  original_analytics_count INTEGER;
  new_analytics_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO shuffles_count FROM public.shuffles;
  SELECT COUNT(*) INTO global_saved_count FROM public.global_shuffles WHERE is_saved = TRUE;
  SELECT COUNT(*) INTO original_analytics_count FROM public.shuffle_analytics;
  SELECT COUNT(*) INTO new_analytics_count FROM public.shuffle_analytics_new;

  RAISE NOTICE 'Original shuffles count: %, Global saved shuffles count: %', shuffles_count, global_saved_count;
  RAISE NOTICE 'Original analytics count: %, New analytics count: %', original_analytics_count, new_analytics_count;

  -- Safety check - only proceed if we've successfully migrated all data
  IF (global_saved_count >= shuffles_count AND new_analytics_count >= original_analytics_count) THEN
    RAISE NOTICE 'Migration validation passed, proceeding with finalization';

    -- Rename the shuffle_analytics tables - out with the old, in with the new
    DROP TABLE IF EXISTS public.shuffle_analytics CASCADE;
    ALTER TABLE public.shuffle_analytics_new RENAME TO shuffle_analytics;

    -- Create necessary indexes for the new analytics table
    CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_shuffle_id ON shuffle_analytics(shuffle_id);
    CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_user_id ON shuffle_analytics(user_id);
    CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_action ON shuffle_analytics(action);
    CREATE INDEX IF NOT EXISTS idx_shuffle_analytics_created_at ON shuffle_analytics(created_at);

    -- Set up RLS policies for the new shuffle_analytics table
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
        shuffle_id IN (SELECT id FROM global_shuffles WHERE user_id = auth.uid())
      );

    -- Allow admins to read all analytics
    CREATE POLICY admin_read_analytics ON shuffle_analytics
      FOR SELECT TO service_role
      USING (true);

    -- Now that we've fully migrated to the global_shuffles table, 
    -- we can safely drop the old shuffles table
    -- Comment this out if you want to keep it as a backup for a while
    -- DROP TABLE IF EXISTS public.shuffles CASCADE;

    RAISE NOTICE 'Migration successfully finalized!';
  ELSE
    RAISE EXCEPTION 'Data migration validation failed! Please check the counts and retry.';
  END IF;
END $$; 