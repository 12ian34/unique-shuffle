# Unique Shuffle

Unique Shuffle is a web application that allows users to shuffle playing cards, save their shuffles, and earn achievements based on patterns and usage.

## Features

- **Card Shuffling**: Generate random shuffles of a standard deck of 52 playing cards
- **Pattern Analysis**: Automatically detect interesting patterns in each shuffle
- **Achievements**: Earn achievements for specific patterns, times, and milestones
- **User Accounts**: Sign up to save favorite shuffles and track progress
- **Leaderboard**: Compete with others for the top spot on global rankings
- **Sharing**: Share your unique shuffles with friends via custom URLs

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account for the backend

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/unique-shuffle.git
   cd unique-shuffle
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and anon key

4. Run migrations in your Supabase database:

   - Use the SQL files in `src/migrations` to set up your database

5. Start the development server:

   ```
   npm run dev
   ```

6. Visit `http://localhost:3000` to see the application

## Authentication Flow

Unique Shuffle uses Supabase Auth for user authentication:

1. **Sign Up**: When a user signs up, a record is created in Supabase Auth, but not yet in the users table
2. **Email Verification**: An email is sent to the user with a verification link
3. **Account Confirmation**: When the user clicks the verification link, the callback handler:
   - Verifies the email through Supabase Auth
   - Creates a new record in the users table with the user's information
   - Initializes user stats (total_shuffles, shuffle_streak)
4. **Sign In**: After verification, users can sign in normally to access their profile

This two-step process ensures that only verified emails get database entries, reducing spam and abandoned accounts.

## Project Structure

```
unique-shuffle/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router components and routes
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utility functions and services
│   ├── migrations/       # Database migrations
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── .env.example          # Example environment variables
├── .env.local            # Local environment variables (gitignored)
├── package.json          # Project dependencies and scripts
└── README.md             # This file
```

## Development

### Key Technologies

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS with shadcn UI components
- **Analytics**: PostHog for event tracking and user behavior analysis

### Building for Production

```
npm run build
```

### Running Tests

```
npm test
```

## Analytics with PostHog

Unique Shuffle uses PostHog for analytics and event tracking:

### Features Implemented

- **Pageview Tracking**: Automatic tracking of all page views across the site
- **User Identification**: Linking anonymous sessions to user accounts after login
- **Event Tracking**: Capturing various user actions:
  - Shuffle events (start, completion, errors)
  - Pattern detection
  - Achievement unlocks
  - Auth events (login, signup, profile updates)
  - Social actions (sharing, viewing shared shuffles)
- **Session Recording**: Configurable recordings to help understand user behavior
- **Feature Flags**: Support for enabling/disabling features per user

### Setup

To enable analytics:

1. Sign up for a [PostHog](https://posthog.com/) account
2. Create a project and get your API key
3. Add the following to your `.env.local` file:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_project_api_key
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com  # or your host
   ```

### Implementation Details

- Server-side tracking using `posthog-node`
- Client-side tracking using `posthog-js`
- React integration with `posthog-js/react` hooks
- NextJS-specific implementation for both App Router and client components
- Proxy configuration in `next.config.js` to avoid ad-blockers

## Interesting Facts

Did you know that a standard deck of 52 playing cards can be arranged in approximately 80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000 different ways? This number is so large that any random shuffle you create is almost certainly unique in human history.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [PostHog](https://posthog.com/)
