# Unique Shuffle - Product Requirements Document

## Overview

Unique Shuffle is a web application that allows users to shuffle playing cards, save their shuffles, and earn achievements based on patterns and usage. The application provides a simple, engaging way for users to interact with card shuffling and discover interesting patterns.

## Core Functionality

### Card Shuffling

- Users can create random shuffles of a standard deck of 52 playing cards
- Each shuffle displays all cards in a grid layout
- Visual animations enhance the shuffling experience
- Each shuffle tracks the pattern of cards and when it was created
- Shuffling process includes both animation and pattern detection
- Users can see all patterns associated with their current shuffle

### Patterns

- Pattern function analyzes shuffles and lists all notable patterns in a nice UI
- Patterns include things like "4 aces in a row" or poker hands (above pair) in any consecutive 5 cards
- Patterns appear in a list above the shuffle with reference to index numbers where relevant
- Some patterns apply to the whole deck (e.g., 100% alternating colors) and don't need specific references
- Comprehensive pattern detection for various card combinations and sequences

### Shuffle Management

- Users can save favorite shuffles to their account
- Each favorite shuffle shared includes the timestamp, user name, a short hash of their ID, view count, unique sharing URL, and associated achievement IDs
- Users can view their shuffle history
- Saved shuffles can be shared with friends via a unique URL
- Shared shuffles display the original card arrangement
- Saved and shared shuffles include the Patterns section
- View count is tracked for shared shuffles
- Users receive confirmation upon successfully saving a shuffle

### User Accounts

- Users can sign up and log in using email authentication via Supabase
- User profiles display stats and achievements
- Users maintain a persistent collection of saved shuffles
- Authentication status persists across sessions
- User stats include total shuffles and daily streak

### Friends

- Users can add each other as friends
- Users can filter leaderboard by friends
- Friend requests support pending, accepted, and rejected statuses
- Friend relationships are bidirectional

### Achievements

- Users earn achievements for specific shuffle patterns (e.g., royal flush, matching suits) linked to the 'Patterns'
- Time-based achievements are available (e.g., midnight shuffle, weekend warrior)
- Count-based achievements track milestones (first shuffle, 10 shuffles, etc.)
- Achievements are checked each time the user shuffles
- If an achievement is earned, the shuffle is saved and linked to the achievement
- Achievement notifications appear when earned and are persisted in the achievements section
- Users can view all available achievements and their progress
- Achievement system distinguishes between new and previously unlocked achievements

### Leaderboard

- Global leaderboard ranks users by total shuffles, achievements, and daily streak
- Users can see their rank compared to everyone else
- Leaderboard can be filtered to show only friends
- Stats are updated in real-time after each shuffle

### Sharing

- Users can share achievements with customizable text and emojis
- Copy to clipboard functionality for easy sharing on social platforms
- Each shared shuffle has a unique URL that anyone can access
- Shared shuffles track view counts for analytics

## User Experience

### Navigation Bar

- shuffle
- achievements
- leaderboard
- profile
- about

and fixed below those is a mini stats bar with the following info:
"global shuffles: <x> your shuffles: <y> daily streak: <z>"
These stats check for changes each time a user hits shuffle.
The global shuffles check for changes every 30 seconds.

### Homepage: "Shuffle"

- Display text: "there is a 1 in 80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000 chance that anyone has shuffled this before. it's probably unique:"
- Quick access to create a new shuffle
- Display of global shuffle counter
- Login/sign-up options for non-authenticated users
- Shuffle animation with visual feedback
- Pattern detection and display
- Achievement notifications
- Option to save current shuffle

### Achievements

- Filterable timeline of all achievements in order of most recent to last including date of achievement and a link to the shuffle if it was saved
- Filterable list of all achievements that can be gained, showing ones already gained
- Cool progress indicator
- Easy share component which generates shareable text with emojis with copy to clipboard option for WhatsApp
- Achievement details including rarity and conditions

### Profile

- User information and stats
- Complete achievement collection
- Saved shuffles
- Account management options
- User streak information

### About

- Link to repo on GitHub
- Link to personal website

## Technical Requirements

### Database Schema

- **users**: User profiles linked to Supabase auth
- **shuffles**: All shuffle data with card patterns
- **achievements**: Records of earned achievements
- **shared_shuffles**: Analytics for shared shuffles
- **friends**: Tracks friend relationships between users

### Authentication

- Email-based authentication using Supabase Auth
- Secure session management
- Protected routes for authenticated features

### Performance

- Fast, responsive UI for shuffle animations
- Efficient database queries
- Mobile-first and optimized for both mobile and desktop
- Real-time stat updates

### Security

- Row-level security for user data
- API endpoint protection
- Input validation on all operations
- Secure sharing mechanism

### CSS

- No inline styles at all
- All styles in styles.css
- Responsive design with Tailwind CSS

### APIs

- No pointless APIs
- RESTful endpoints for core functionality
- Secure API access with authentication

### Components

- All in top level components folder, no exceptions
- Reusable UI components for consistent experience
- Error boundaries for graceful error handling

### Tests

- Tests for UI components, logic, calculations, functions, and database operations
- Use same testing library throughout the project

### Error Handling

- Graceful error handling for failed shuffles, network issues, and database operations
- User-friendly error messages with appropriate recovery options
- Client-side validation for form inputs and user actions
- Comprehensive error logging with structured error objects for debugging
- Fallback UI components for when data cannot be loaded

### Supabase Suggested Types

Strongly suggested (feel free to change if there is good reason to do so, but make sure you explain why):

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          total_shuffles: number
          shuffle_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          total_shuffles?: number
          shuffle_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          total_shuffles?: number
          shuffle_streak?: number
          created_at?: string
          updated_at?: string
        }
      }
      shuffles: {
        Row: {
          id: string
          user_id: string | null
          cards: Json
          is_saved: boolean
          is_shared: boolean
          share_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          cards: Json
          is_saved?: boolean
          is_shared?: boolean
          share_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          cards?: Json
          is_saved?: boolean
          is_shared?: boolean
          share_code?: string | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          shuffle_id: string | null
          achieved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          shuffle_id?: string | null
          achieved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          shuffle_id?: string | null
          achieved_at?: string
        }
      }
      shared_shuffles: {
        Row: {
          id: string
          shuffle_id: string
          views: number
          last_viewed_at: string
        }
        Insert: {
          id?: string
          shuffle_id: string
          views?: number
          last_viewed_at?: string
        }
        Update: {
          id?: string
          shuffle_id?: string
          views?: number
          last_viewed_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
```

### Supabase Suggested Initial Migration

```sql
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
```

## future work

### Accessibility Requirements

- WCAG 2.1 AA compliance for all components and pages
- Keyboard navigation support throughout the application
- Screen reader compatibility with proper ARIA attributes
- Sufficient color contrast for all UI elements
- Support for text scaling and responsive layouts

### Pattern Definitions

Complete list of patterns to be detected:

- Poker hands: Royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair
- Sequential patterns: 4+ cards in numerical sequence
- Color patterns: Alternating colors, all red/black sections
- Suit patterns: 4+ cards of the same suit in sequence
- Special combinations: 4 aces in a row, all face cards grouped
- Each pattern includes a name, description, and relative rarity indicator

### User Settings

- Dark/light mode toggle
- Animation toggle (on/off)
- Notification preferences
- Card display options (compact/standard view)
- Privacy settings for profile visibility
- Settings are persisted in user profile

### Notification System

- In-app notifications for achievements earned
- Friend request notifications with accept/decline actions
- System notifications for important events
- Notification history accessible from user profile
- Email notification options for critical updates

### Account Management

- Complete account deletion process with data handling options
- Password reset functionality
- Email change option with verification
- Account data export capability
- Account security options including session management
- Username change capability with history tracking

### Daily Streak Logic

- A user maintains a streak by shuffling at least once every day
- The streak counter increments at the first shuffle of each new day
- Streak is reset to zero if a user does not shuffle for a full calendar day
- Time zone considerations are handled to ensure fairness
- Special achievements for milestone streaks (7, 30, 100 days)
- Visual indicator shows time remaining to maintain streak

### Friend Request UI Flow

- Users can search for other users by username
- Friend request buttons appear on user profiles and search results
- Pending requests section in profile shows outgoing and incoming requests
- Friend requests can be accepted, declined, or ignored
- Friend management UI for removing or blocking connections
- Friend activity feed shows recent achievements and shuffles

### Mobile-Specific UI Considerations

- Touch-optimized card interactions for mobile devices
- Simplified views for small screens with collapsible sections
- Bottom navigation bar replaces top nav on mobile
- Pull-to-refresh functionality for data updates
- Special accommodations for iOS and Android gesture systems
- Optimized tap targets (minimum 44x44px) for all interactive elements

### Privacy and Data Policy

- Clear data collection and usage policies
- Consent management for analytics and tracking
- Data retention periods for user information
- Third-party data sharing policies
- User controls for privacy preferences
- Compliance with relevant privacy regulations (GDPR, CCPA)

### Rate Limiting

- API rate limits to prevent abuse of shuffle functionality
- Graduated rate limiting based on user activity
- Clear user feedback when limits are approached or exceeded
- IP-based and user-based rate limiting
- Exponential backoff for repeated rapid requests
- Anti-automation measures for public endpoints

### User Onboarding

- First-time user tutorial explaining core functionality
- Guided tour of the application's main features
- Progressive disclosure of advanced features
- Achievement-based onboarding to encourage exploration
- Quick tips throughout the interface
- Onboarding completion tracking with the ability to reset/review
