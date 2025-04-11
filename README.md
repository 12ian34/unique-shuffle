# shuffle

Creates and tracks unique card shuffles with a focus on statistics, achievements, and social features.

## features

### shuffling

- Generate mathematically unique card shuffles using the Fisher-Yates algorithm
- Beautiful visual representation of card shuffles
- View your past shuffles with timestamps and card details
- Track total shuffles across all users

### user

- Secure login/signup using Supabase authentication
- Personalized profiles with shuffle statistics and achievements
- Count consecutive days of shuffling cards

### stats

- Track your total shuffles, streak, and most common cards
- Visualize your shuffle patterns and trends
- See which cards appear most frequently in your shuffles

### achievements

- Earn achievements based on shuffle count, streaks, and more
- **categories**:
  - Shuffle Count (Novice Shuffler, Card Enthusiast, Shuffle Master)
  - Streak Achievements (Consistent Shuffler, Weekly Devotee, Card Aficionado)
  - Special Combinations (coming soon)

### social

- Compare your statistics with other users
- View community shuffle patterns

### technical

- Live updates using Supabase subscriptions
- Works on all device sizes using Tailwind CSS
- Shuffles stored securely in Supabase database
- Fast initial page loads with Next.js

## stack

- Next.js 15, React 18, TypeScript
- Radix UI, Tailwind CSS
- Recharts
- Supabase
- React Hooks
- \*\*Tailwind CSS with custom components

## for developers

### prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Supabase account

### installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/unique-shuffle.git
   cd unique-shuffle
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file with the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the application

### Development Commands

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types
- `npm run validate` - Run lint and typecheck
- `npm run stylelint` - Run stylelint for CSS
- `npm run test` - Run tests
- `npm run test:api` - Run API tests

## License

MIT
