-- Migration file to cleanup database structure and clear all data
-- This migration:
-- 1. Drops unused/obsolete tables and views
-- 2. Clears all data from essential tables
-- 3. Keeps only the three core tables: global_shuffles, leaderboard, and shuffle_analytics

-- First, drop the view
DROP VIEW IF EXISTS public.shuffles_view;

-- Then drop obsolete tables
DROP TABLE IF EXISTS public.shuffles CASCADE;
DROP TABLE IF EXISTS public.shuffle_analytics_new CASCADE;

-- Clear all data from the essential tables
TRUNCATE TABLE public.global_shuffles CASCADE;
TRUNCATE TABLE public.shuffle_analytics CASCADE;
TRUNCATE TABLE public.leaderboard CASCADE;

-- Reset the sequence counters
ALTER SEQUENCE IF EXISTS global_shuffles_id_seq RESTART WITH 1;

-- If the global_shuffle_counter exists, reset it
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_sequences WHERE sequencename = 'global_shuffle_counter') THEN
    ALTER SEQUENCE global_shuffle_counter RESTART WITH 1;
  END IF;
END
$$;

-- Verify the remaining structure matches our expectations
DO $$
BEGIN
  -- Check we have exactly 3 tables remaining
  IF (SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('global_shuffles', 'leaderboard', 'shuffle_analytics')) != 3 THEN
    RAISE EXCEPTION 'Expected exactly 3 tables (global_shuffles, leaderboard, shuffle_analytics), please check the migration.';
  END IF;
  
  RAISE NOTICE 'Database cleanup completed. Kept only essential tables: global_shuffles, leaderboard, shuffle_analytics.';
  RAISE NOTICE 'All data has been cleared and sequences reset.';
END
$$; 