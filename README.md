# unique shuffle

[![Netlify Status](https://api.netlify.com/api/v1/badges/5e8bd144-63c7-46ab-ab91-4e47ff15d12c/deploy-status)](https://app.netlify.com/sites/unique-shuffle/deploys)

https://unique-shuffle.netlify.app

Unique Shuffle is a web application that lets users generate and explore random card shuffles, track interesting patterns, and earn achievements through gamified interactions.

![Unique Shuffle](https://placekitten.com/800/400)

## Features

- **Card Shuffling**: Generate truly random shuffles of a standard deck of 52 playing cards
- **Pattern Analysis**: Automatically detect interesting patterns and sequences in each shuffle
- **Achievements**: Earn badges and rewards for specific patterns, milestones, and daily streaks
- **User Profiles**: Create an account to save favorite shuffles and track your collection
- **Leaderboards**: Compete globally for achievements and rare shuffle discoveries
- **Social Sharing**: Share your unique shuffles via custom URLs or social media integrations

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account for backend services
- PostHog account for analytics (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/unique-shuffle.git
   cd unique-shuffle
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your Supabase credentials and other required values.

4. Run migrations in your Supabase database:

   ```bash
   npx supabase db push
   # or manually run SQL files from src/migrations
   ```

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Visit `http://localhost:3000` to see the application

## Authentication Flow

Unique Shuffle implements a secure, multi-step authentication process using Supabase Auth:

1. **Sign Up**: User creates an account with email + password or OAuth provider
2. **Email Verification**: Verification email sent with secure, time-limited token
3. **Account Activation**: Upon verification, the system:
   - Confirms the user in Supabase Auth
   - Creates a user record in the database with default values
   - Initializes stats (total_shuffles, achievements, shuffle_streak)
4. **Sign In**: Verified users can access their personalized experience

This approach ensures data integrity, reduces fake accounts, and provides a secure foundation for user data.

## Project Structure

```
unique-shuffle/
├── public/               # Static assets and images
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   │   ├── api/          # API routes and serverless functions
│   │   ├── auth/         # Authentication-related pages
│   │   ├── dashboard/    # User dashboard components
│   │   └── shuffle/      # Shuffle generation and display
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI components (shadcn)
│   │   ├── cards/        # Card rendering components
│   │   └── layout/       # Layout components
│   ├── lib/              # Core utilities and services
│   │   ├── supabase/     # Supabase client and helpers
│   │   ├── analytics/    # PostHog integration
│   │   └── utils/        # Shared utility functions
│   ├── migrations/       # Database migration scripts
│   └── types/            # TypeScript type definitions
├── .env.example          # Example environment variables
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

## Technology Stack

### Frontend

- **Framework**: Next.js 14 with App Router and React 18
- **State Management**: React Context + Hooks, Server Actions
- **Styling**: Tailwind CSS, shadcn/ui components
- **Animation**: Framer Motion for card interactions

### Backend

- **API**: Next.js API Routes, Server Components
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with OAuth integrations
- **Storage**: Supabase Storage for user assets

### DevOps

- **Hosting**: Netlify for frontend and serverless functions
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Analytics**: PostHog for event tracking and analysis
- **Monitoring**: Sentry for error tracking

## Analytics Implementation

Unique Shuffle utilizes PostHog for comprehensive user analytics:

### Tracked Events

- **Shuffle Analytics**: Frequency, timing, and type of shuffles
- **Pattern Discovery**: Detection of patterns and user interactions
- **Achievement Metrics**: Completion rates and progression paths
- **Session Data**: User journeys and feature engagement
- **Performance Metrics**: Load times and interaction delays

### Setup

1. Create a [PostHog](https://posthog.com/) account
2. Add your API keys to environment variables:

   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_project_api_key
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

3. (Optional) Configure data retention and GDPR compliance settings

### Technical Implementation

- Isomorphic tracking via PostHog SDK
- Custom event properties for detailed analysis
- GDPR-compliant consent management
- Feature flag integration for A/B testing
- Performance impact minimized through batching and lazy-loading

## Card Mathematics

A standard deck of 52 playing cards can be arranged in 52! (52 factorial) different ways:

52! = 8.0658 × 10^67

This number is so astronomically large that even if every person on Earth generated a trillion shuffles per second since the beginning of the universe, we would have explored only a tiny fraction of all possible arrangements.

## Contributing

We welcome contributions to Unique Shuffle! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.io/) - Open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [PostHog](https://posthog.com/) - Open-source product analytics
- [Netlify](https://netlify.com/) - Deployment platform
