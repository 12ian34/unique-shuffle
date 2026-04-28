# unique shuffle

## what this is
unique shuffle is a web app that lets anyone shuffle a full 52-card deck and see just how unlikely it is to ever repeat a shuffle. it turns each shuffle into a small discovery moment with patterns, achievements, and sharing.

## purpose and goals
- make the sheer scale of 52! feel real and fun
- turn shuffling into a game of discovery (patterns, rarity, milestones)
- give players ways to save, share, and compare shuffles with friends
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
- login and sign-up options available for saving and sharing

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
- save shuffles to your account
- view your saved shuffle history
- share a shuffle via a unique link
- public view for shared shuffles that preserves the exact arrangement
- view count tracking for shared shuffles
- shared shuffles include the same pattern list as the original
- shared items show timestamp and owner info
- clear confirmation when a shuffle is saved

### profile and stats
- profile page with your totals, streak, and achievements
- persistent collection of saved shuffles
- quick access to your recent activity
- account management options in one place

### social and leaderboard
- add friends and manage requests
- friends-only leaderboard filter
- global leaderboard tabs for shuffles, achievements, and streaks
- see your rank alongside everyone else
- leaderboard updates after each shuffle

### polish and accessibility
- responsive, mobile-first layout
- clear toasts and error messaging when something goes wrong
- light/dark theme toggle

## main pages and flows
- **shuffle**: create a new shuffle, view patterns, save and share
- **achievements**: timeline, progress, and sharing tools
- **leaderboard**: global and friends views with stat tabs
- **profile**: stats, saved shuffles, achievements, and friends
- **about**: what the app is and links out
- **shared shuffle**: public view for a specific shared shuffle
- **auth**: login and sign-up flow for saving, sharing, and social features

## changelog
- 2026-02-01: reset this doc to a product-only overview focused on user features
- 2026-02-01: expanded feature coverage to match product requirements
- 2026-02-01: scaffolded Next.js app with core shuffle UI and placeholder pages
- 2026-02-01: added pattern detection and achievement share basics
- 2026-02-01: integrated Supabase auth scaffolding with save/share APIs
- 2026-02-01: added profile, achievements, friends, and leaderboard data views
- 2026-02-01: added stats bar and theme toggle with light/dark support

## roadmap (product-only)
- accessibility: keyboard navigation, screen reader support, contrast checks
- settings: animation toggle, notification preferences, card display options, privacy controls
- notifications: friend request alerts, achievement inbox/history, optional email notices
- account management: password reset, email change, data export, account deletion
- onboarding: first-time tutorial and guided tours
- social expansion: friend search, activity feed, remove/block options
- mobile polish: bottom navigation on small screens, pull-to-refresh
