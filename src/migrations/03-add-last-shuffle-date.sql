-- Add last_shuffle_date to users table for tracking daily streaks

-- Add the column
ALTER TABLE public.users 
ADD COLUMN last_shuffle_date DATE;

-- Create function to update streak based on consecutive daily shuffles
CREATE OR REPLACE FUNCTION update_daily_shuffle_streak()
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  today DATE := CURRENT_DATE;
BEGIN
  -- If this is the first shuffle (no previous date)
  IF OLD.last_shuffle_date IS NULL THEN
    NEW.shuffle_streak := 1;
  -- If already shuffled today, don't change anything
  ELSIF OLD.last_shuffle_date = today THEN
    NEW.shuffle_streak := OLD.shuffle_streak;
  -- If shuffled yesterday, increment streak
  ELSIF OLD.last_shuffle_date = yesterday THEN
    NEW.shuffle_streak := OLD.shuffle_streak + 1;
  -- Otherwise, streak broken, reset to 1
  ELSE
    NEW.shuffle_streak := 1;
  END IF;
  
  -- Always update the date to today
  NEW.last_shuffle_date := today;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_user_streak_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
WHEN (OLD.last_shuffle_date IS DISTINCT FROM NEW.last_shuffle_date OR NEW.last_shuffle_date IS NULL)
EXECUTE FUNCTION update_daily_shuffle_streak();

-- Update existing records to set last_shuffle_date to NULL or today based on existing streak
UPDATE public.users
SET last_shuffle_date = CASE 
  WHEN shuffle_streak > 0 THEN CURRENT_DATE
  ELSE NULL
END; 