# Agent Notes

## Project Snapshot

- Unique Shuffle is a Next.js App Router web app that lets users shuffle a full 52-card deck and feel how unlikely repeats are through pattern discovery, local achievements, local saved shuffles, public sharing, and global stats.
- Source lives under `src/`: pages and API routes in `src/app`, reusable components in `src/components`, shared services in `src/lib`, Drizzle schema/client in `src/lib/db`, and shared types in `src/types`.
- Styling uses Tailwind CSS with small reusable UI primitives in `src/components/ui`.
- The live app is intended to stay on Netlify. Browser profile data lives in localStorage; Neon Postgres stores only global count and explicitly shared shuffles.

## Product Context

- Core experience: generate and animate a random 52-card shuffle, display the full deck, surface rarity/uniqueness messaging, and save/share without accounts.
- Pattern discovery: automatically detect poker hands and notable sequences, show readable pattern callouts, and map highlights back to card positions where useful.
- Achievements: award rare-pattern, milestone, and time-based achievements with notifications, progress views, rarity details, trigger links, and shareable text.
- Saving and sharing: save shuffles locally, browse local history, create public share links on demand, preserve exact arrangements, track views, and show display name/timestamp/pattern details.
- Profile and stats: show local totals, streaks, saved shuffles, achievements, and export/import profile JSON.
- Polish: keep the app responsive and mobile-friendly, with clear toasts/errors, light/dark theme support, and accessible interactions.

## Main Pages And Flows

- `shuffle`: create a shuffle, view patterns, save, and share.
- `achievements`: view timeline, progress, details, and sharing tools.
- `leaderboard`: view global shuffle stats.
- `profile`: view local stats, achievements, and export/import profile data.
- `about`: explain the app and provide relevant links.
- `shared shuffle`: public view for a specific saved arrangement.

## Local-First Data

- Local profile data lives in browser localStorage via `src/lib/local-profile.ts` and `src/contexts/LocalProfileContext.tsx`.
- Local profile data includes display name, total shuffles, streak, earned achievements, and saved shuffles.
- Database access uses Drizzle with the Neon serverless driver from `src/lib/db/index.ts`.
- App schema lives in `src/lib/db/schema.ts`; generated SQL migrations live in `drizzle/`.
- Neon Postgres stores only `global_stats` and `public_shared_shuffles` for the current local-first product. Legacy auth/profile/friend tables may exist until an explicit cleanup migration.
- Required env vars: `NEXT_PUBLIC_APP_URL`, plus either `DATABASE_URL` or the Neon CLI parts `NEON_HOST`, `NEON_DATABASE`, `NEON_ROLE`, `NEON_PASSWORD`, and optional `NEON_POOLER_HOST`.

## Common Commands

- `npm install` to install dependencies from `package-lock.json`.
- `npm run lint` for Next/ESLint checks.
- `npm run typecheck` for TypeScript.
- `npm run validate` runs lint and typecheck.
- `npm run db:generate` creates Drizzle migrations after schema changes.
- `npm run db:migrate` applies Drizzle migrations to the configured Neon database.
- `npm run db:studio` opens Drizzle Studio.
- `npm test` runs `src/tests/index.js` smoke checks.

## Dependency Notes

- Keep `next` and `eslint-config-next` on the same major/minor line unless intentionally migrating both.
- `package.json` uses npm `overrides` for patched transitive security releases when upstream packages pin vulnerable versions.
- After dependency changes, run `npm audit` and at least `npm run validate` when dependencies are installed.

## Product Roadmap

- Make the local-first model obvious before adding new features. Profile and saved-shuffle surfaces should explain that data is stored on this browser and that export is the backup path.
- Improve first-run backup education. After a first meaningful save or achievement, prompt users to export their profile JSON.
- Rename or reposition `leaderboard` as `global stats`; per-user rankings are misleading while accounts are removed.
- Improve export UX by downloading a `.json` file as well as supporting clipboard/file import.
- Add stronger reset guardrails, such as requiring the user to type `reset` before clearing the local profile.
- Add rate limiting or abuse protection for global count and public share endpoints.
- Accessibility: keyboard navigation, screen reader support, and contrast checks.
- Settings: animation toggle, notification preferences, card display options, and privacy controls.
- Notifications: achievement inbox/history and optional local notification preferences.
- Profile portability: safer import/export UX and local data loss education.
- Onboarding: first-time tutorial and guided tours.
- Mobile polish: bottom navigation on small screens and pull-to-refresh.

## Changelog Notes

- 2026-05-01: Replaced Supabase auth/data with Neon Auth, Neon Postgres, and Drizzle migrations while keeping Netlify hosting.
- 2026-05-01: Removed account auth and moved profiles, saved shuffles, and achievements to localStorage; Neon now stores global count and explicitly shared shuffles.

## Safety

- Do not commit secrets or local environment files.
- Database migrations live in `drizzle/`; ask before applying production migrations.
