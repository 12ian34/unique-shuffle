-- Create shuffles table
create table public.shuffles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  cards jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create leaderboard table
create table public.leaderboard (
  user_id uuid references auth.users primary key,
  username text not null,
  total_shuffles integer default 0 not null,
  unique_cards_count integer default 0 not null,
  achievements_count integer default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.shuffles enable row level security;
alter table public.leaderboard enable row level security;

-- Create policies for shuffles
create policy "Users can view their own shuffles"
  on public.shuffles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own shuffles"
  on public.shuffles for insert
  with check (auth.uid() = user_id);

-- Create policies for leaderboard
create policy "Anyone can view leaderboard"
  on public.leaderboard for select
  using (true);

create policy "Users can update their own leaderboard entry"
  on public.leaderboard for update
  using (auth.uid() = user_id);

create policy "Users can insert their own leaderboard entry"
  on public.leaderboard for insert
  with check (auth.uid() = user_id);