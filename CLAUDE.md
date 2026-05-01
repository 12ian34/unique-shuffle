# unique shuffle

## what this is
unique shuffle is a web app that lets anyone shuffle a full 52-card deck and see just how unlikely it is to ever repeat a shuffle. it turns each shuffle into a small discovery moment with patterns, achievements, and sharing.

## purpose and goals
- make the sheer scale of 52! feel real and fun
- turn shuffling into a game of discovery (patterns, rarity, milestones)
- give players ways to save locally, export/import their profile, and share selected shuffles
- keep the experience fast, visual, and mobile-friendly

## user experience at a glance
- simple top-level navigation: shuffle, achievements, leaderboard, profile, about
- a fixed mini stats bar that shows global shuffles, your shuffles, and daily streak
- live stats updates after each shuffle, with global counts refreshing regularly
- a playful, visual shuffle animation followed by a full deck grid
- clear, compact pattern callouts and achievement celebrations

## feature inventory (user-facing)

### core shuffle experience
- generate a random shuffle of a standard 52-card deck
- animated shuffling sequence with immediate visual feedback
- full deck displayed in a grid for quick scanning
- a uniqueness message that frames how unlikely any repeat is
- saving and achievements work locally without login

### pattern discovery
- automatic pattern detection after each shuffle
- poker hands and notable sequences surfaced in a readable list (e.g., royal flush, full house, four of a kind)
- pattern highlights map back to card positions where relevant
- whole-deck patterns (like color runs) called out without index clutter

### achievements
- earn achievements for rare patterns and milestones
- time-based achievements (e.g., late-night or weekend shuffles)
- count-based milestones (first shuffle, big totals)
- achievement notifications as they happen
- filterable timeline of earned achievements with dates
- list of all achievements with progress indicators
- achievement details like rarity and conditions
- link to the shuffle that triggered an achievement when it was saved
- shareable achievement text with emojis and copy-to-clipboard (including WhatsApp-ready text)

### saving and sharing shuffles
- save shuffles to the browser's local profile
- view your saved shuffle history
- explicitly share a shuffle via a unique public link
- public view for shared shuffles that preserves the exact arrangement
- view count tracking for shared shuffles
- shared shuffles include the same pattern list as the original
- shared items show timestamp and owner info
- clear confirmation when a shuffle is saved

### profile and stats
- profile page with your totals, streak, and achievements
- persistent collection of saved shuffles
- quick access to your recent activity
- export/import profile JSON and reset local profile

### global stats
- every shuffle increments the global shuffle count
- global stats update after each shuffle
- individual profiles stay local unless a shuffle is explicitly shared

### polish and accessibility
- responsive, mobile-first layout
- clear toasts and error messaging when something goes wrong
- light/dark theme toggle

## main pages and flows
- **shuffle**: create a new shuffle, view patterns, save and share
- **achievements**: timeline, progress, and sharing tools
- **leaderboard**: global shuffle stats
- **profile**: local stats, saved shuffles, achievements, and export/import
- **about**: what the app is and links out
- **shared shuffle**: public view for a specific shared shuffle

## changelog
- 2026-02-01: reset this doc to a product-only overview focused on user features
- 2026-02-01: expanded feature coverage to match product requirements
- 2026-02-01: scaffolded Next.js app with core shuffle UI and placeholder pages
- 2026-02-01: added pattern detection and achievement share basics
- 2026-02-01: integrated Supabase auth scaffolding with save/share APIs
- 2026-02-01: added profile, achievements, friends, and leaderboard data views
- 2026-02-01: added stats bar and theme toggle with light/dark support
- 2026-05-01: replaced Supabase auth/data with Neon Auth, Neon Postgres, and Drizzle migrations while keeping Netlify hosting
- 2026-05-01: removed account auth and moved profile, achievements, and saved shuffles to localStorage; Neon keeps global count and public shared shuffles

## roadmap (product-only)
- accessibility: keyboard navigation, screen reader support, contrast checks
- settings: animation toggle, notification preferences, card display options, privacy controls
- notifications: achievement inbox/history, optional local preferences
- profile portability: better export/import UX and local data-loss education
- onboarding: first-time tutorial and guided tours
- mobile polish: bottom navigation on small screens, pull-to-refresh
