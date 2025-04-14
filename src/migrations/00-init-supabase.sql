-- Create a simplified schema for Unique Shuffle application

-- Create users table linked to Supabase Auth
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  total_shuffles INTEGER DEFAULT 0 NOT NULL,
  shuffle_streak INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create shuffles table to store all shuffles
CREATE TABLE public.shuffles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  cards JSONB NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE NOT NULL,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create achievements table to track user achievements
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_id TEXT NOT NULL,
  shuffle_id UUID REFERENCES public.shuffles,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, achievement_id)
);

-- Create shared_shuffles table to track shared shuffle analytics
CREATE TABLE public.shared_shuffles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shuffle_id UUID REFERENCES public.shuffles NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create friends table to track user friendships
CREATE TABLE public.friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  friend_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, friend_id),
  CHECK (user_id != friend_id),
  CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shuffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_shuffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for shuffles table
CREATE POLICY "Users can view their own shuffles"
  ON public.shuffles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shuffles"
  ON public.shuffles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shuffles"
  ON public.shuffles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared shuffles"
  ON public.shuffles FOR SELECT
  USING (is_shared = TRUE);

-- Create policies for achievements table
CREATE POLICY "Users can view their own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for shared_shuffles table
CREATE POLICY "Anyone can view shared shuffle analytics"
  ON public.shared_shuffles FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can update shared shuffle analytics"
  ON public.shared_shuffles FOR UPDATE
  USING (TRUE);

-- Create policies for friends table
CREATE POLICY "Users can view their own friendships"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friendship requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendship status"
  ON public.friends FOR UPDATE
  USING (auth.uid() = friend_id);

-- Create indexes for performance
CREATE INDEX shuffles_user_id_idx ON public.shuffles(user_id);
CREATE INDEX achievements_user_id_idx ON public.achievements(user_id);
CREATE INDEX shuffles_share_code_idx ON public.shuffles(share_code);
CREATE INDEX friends_user_id_idx ON public.friends(user_id);
CREATE INDEX friends_friend_id_idx ON public.friends(friend_id); 