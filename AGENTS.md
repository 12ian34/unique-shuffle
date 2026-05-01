# Agent Notes

## Project Snapshot

- Next.js App Router app for a 52-card shuffle game with achievements, sharing, leaderboards, Neon Auth/Neon Postgres data, and PostHog analytics.
- Source lives under `src/`: pages and API routes in `src/app`, reusable components in `src/components`, shared services in `src/lib`, Drizzle schema/client in `src/lib/db`, and shared types in `src/types`.
- Styling uses Tailwind CSS with small reusable UI primitives in `src/components/ui`.
- The live app is intended to stay on Netlify while auth and data live in Neon.

## Auth And Data

- Neon Auth is initialized in `src/lib/auth/server.ts` and `src/lib/auth/client.ts`.
- Auth API requests are proxied through `src/app/api/auth/[...path]/route.ts`.
- App-owned user profile data lives in `user_profiles`, keyed by the Neon Auth user id. Use `ensureUserProfile()` from `src/lib/auth/profile.ts` before writing user-owned data.
- Database access uses Drizzle with the Neon serverless driver from `src/lib/db/index.ts`.
- App schema lives in `src/lib/db/schema.ts`; generated SQL migrations live in `drizzle/`.
- Do not use browser-side database writes for user data. Client components should call app API routes, and API routes should authorize with `auth.getSession()` / `getCurrentUser()`.
- Required env vars: `NEON_AUTH_COOKIE_SECRET` and `NEXT_PUBLIC_APP_URL`, plus either `DATABASE_URL` or the Neon CLI parts `NEON_HOST`, `NEON_DATABASE`, `NEON_ROLE`, `NEON_PASSWORD`, and optional `NEON_POOLER_HOST`. `VITE_NEON_AUTH_URL` is accepted as an alias for `NEON_AUTH_BASE_URL`.

## Common Commands

- `npm install` to install dependencies from `package-lock.json`.
- `npm run lint` for Next/ESLint checks.
- `npm run typecheck` for TypeScript.
- `npm run validate` runs lint and typecheck.
- `npm run db:generate` creates Drizzle migrations after schema changes.
- `npm run db:migrate` applies Drizzle migrations to the configured Neon database.
- `npm run db:studio` opens Drizzle Studio.
- `npm test` is configured to run `src/tests/index.js`, but that runner is not currently present.

## Dependency Notes

- Keep `next` and `eslint-config-next` on the same major/minor line unless intentionally migrating both.
- `package.json` uses npm `overrides` for patched transitive security releases when upstream packages pin vulnerable versions.
- After dependency changes, run `npm audit` and at least `npm run validate` when dependencies are installed.

## Safety

- Do not commit secrets or local environment files.
- Database migrations live in `drizzle/`; ask before applying production migrations.
