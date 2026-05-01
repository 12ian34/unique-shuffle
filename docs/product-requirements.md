# Unique Shuffle - Product Requirements Document

## Overview

Unique Shuffle lets anyone shuffle a 52-card deck, discover rare patterns, earn achievements, save favorite shuffles locally, and share selected shuffles with public links. The app is local-first: profile data lives in the browser and can be exported/imported as JSON.

## Core Functionality

### Card Shuffling

- Users can create random shuffles of a standard 52-card deck.
- Each shuffle displays all cards in a responsive grid.
- Visual animation makes the shuffle feel immediate and playful.
- Each shuffle runs pattern detection and achievement checks.
- Every shuffle increments the global shuffle count, including anonymous/local users.

### Patterns

- Pattern detection lists notable patterns in a readable UI.
- Patterns include poker hands above pair in consecutive 5-card windows, sequences, color runs, suit runs, and special whole-deck patterns.
- Pattern callouts include index references where useful.
- Whole-deck patterns can omit noisy index lists.

### Local Profile

- No account, login, or cloud identity is required.
- A local profile is generated in browser localStorage.
- The local profile stores display name, total shuffles, daily streak, earned achievements, and saved shuffles.
- Users can edit their display name.
- Users can export/import their full profile as JSON.
- Clearing browser storage deletes the local profile unless the user has exported it.

### Shuffle Management

- Users can save favorite shuffles locally.
- Achievement-triggering shuffles are saved locally and linked to the achievement row.
- Users can view local saved shuffle history.
- Users can remove saved shuffles from local storage.
- Users can explicitly share a saved/current shuffle to create a public URL.

### Achievements

- Users earn achievements for specific shuffle patterns, time windows, and count milestones.
- Achievements are checked on every shuffle.
- New and previously earned achievements are distinguished.
- Earned achievement history persists in the local profile.
- Users can view all available achievements, progress, category filters, and share text.

### Sharing

- Sharing is opt-in.
- A shared shuffle uploads the exact card arrangement, detected patterns, achievement IDs, display name, short local profile hash, timestamp, and view count.
- Public shared shuffle URLs preserve the original arrangement.
- Public shared shuffle pages show patterns and track views.
- Copy-to-clipboard is available for shared shuffle links and achievement text.

### Global Stats

- The server stores a global shuffle counter.
- The mini stats bar shows global shuffles, local shuffles, and local daily streak.
- Global shuffles refresh every 30 seconds and after each shuffle.
- There is no per-user leaderboard while accounts are removed.

## User Experience

### Navigation Bar

- shuffle
- achievements
- leaderboard/global stats
- profile
- saved
- about

Below navigation is a mini stats bar:

`global shuffles:  your shuffles:  streak:`

### Homepage

- Display the 52! uniqueness message.
- Quick access to shuffle.
- Shuffle animation with feedback.
- Pattern detection and display.
- Achievement notifications.
- Save current shuffle locally.
- Increment global count for every shuffle.

### Achievements

- Progress indicator.
- Filterable list of all achievements.
- Timeline/history of locally earned achievements.
- Achievement details and share actions.

### Profile

- Local display name.
- Local total shuffles, streak, saved shuffle count.
- Earned achievement summary.
- Export/import profile JSON.
- Reset local profile.

### Saved Shuffles

- List locally saved shuffles.
- Share saved shuffles to create public URLs.
- Copy existing share URLs.
- Remove saved shuffles.

### About

- Explain 52! and the product.
- Link to the GitHub repo.
- Link to Ian Ahuja's website.

## Technical Requirements

### Storage

- Browser localStorage is the source of truth for profile data.
- Local profile schema is versioned for future migrations.
- Server storage is limited to global stats and explicitly shared shuffles.

### Database Schema

- `global_stats`: stores aggregate shuffle count.
- `public_shared_shuffles`: stores opt-in shared shuffle payloads and view counts.
- Legacy auth/profile/friend tables may remain until a later explicit cleanup migration.

### APIs

- `GET /api/shuffles/global-count`: read global count.
- `POST /api/shuffles/global-count`: increment global count.
- `POST /api/shuffle/share`: upload an explicitly shared shuffle and return a share code.
- `GET /api/shuffle/share?code=...`: read public shared shuffle metadata.
- `GET /shared/[code]`: public shared shuffle page.
- Auth/profile/friends server APIs should be retired or return local-first guidance.

### Security And Privacy

- Local profile data never leaves the browser unless the user exports it or explicitly shares a shuffle.
- Shared shuffle data is public once uploaded.
- Import JSON must be validated before replacing local profile state.
- Public API inputs must be validated.
- Do not print or commit secrets.

### Performance

- Shuffle animation and local persistence should feel instant.
- Avoid blocking rendering on server profile requests.
- Shared/global API calls should fail gracefully without breaking local gameplay.

### Tests

- Smoke tests should verify dependencies, env docs, local profile module, and Drizzle schema.
- Behavior tests should cover local profile import/export, shuffle recording, achievement persistence, saved shuffle persistence, and share payload validation.

## Future Work

- Accessibility: keyboard navigation, screen reader support, contrast checks.
- Settings: animation toggle, notification preferences, card display options, privacy controls.
- Optional cloud sync if a real account model is intentionally reintroduced.
- Onboarding for export/import and local data loss risks.
- Mobile polish: bottom navigation on small screens and pull-to-refresh.
- Rate limiting for public global count and share endpoints.
