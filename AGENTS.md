# Agent Notes

## Project Snapshot

- Next.js App Router app for a 52-card shuffle game with achievements, sharing, leaderboards, Supabase auth/data, and PostHog analytics.
- Source lives under `src/`: pages and API routes in `src/app`, reusable components in `src/components`, shared services in `src/lib`, migrations in `src/migrations`, and shared types in `src/types`.
- Styling uses Tailwind CSS with small reusable UI primitives in `src/components/ui`.

## Common Commands

- `npm install` to install dependencies from `package-lock.json`.
- `npm run lint` for Next/ESLint checks.
- `npm run typecheck` for TypeScript.
- `npm run validate` runs lint and typecheck.
- `npm test` is configured to run `src/tests/index.js`, but that runner is not currently present.

## Dependency Notes

- Keep `next` and `eslint-config-next` on the same major/minor line unless intentionally migrating both.
- `package.json` uses npm `overrides` for patched transitive security releases when upstream packages pin vulnerable versions.
- After dependency changes, run `npm audit` and at least `npm run validate` when dependencies are installed.

## Safety

- Do not commit secrets or local environment files.
- Database migrations live in `src/migrations`; ask before applying production migrations.
