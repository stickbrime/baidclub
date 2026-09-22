# Base44 Development Guide

## Stack
- **Frontend**: React 19 + Vite 7 (port 3000), Tailwind CSS, shadcn/ui components
- **Backend**: Hono + tRPC, served via `@hono/vite-dev-server` (single origin with frontend)
- **Database**: MySQL 8 via Drizzle ORM (`drizzle-orm/mysql2`, planetscale mode)
- **Language**: TypeScript throughout (frontend, API, shared contracts)

## Architecture
- The Vite dev server serves both the React frontend and the Hono/tRPC API on port 3000.
- tRPC routes are mounted at `/api/trpc/*`. The frontend client calls `/api/trpc` in dev mode.
- In production, the backend is bundled with esbuild and served via `@hono/node-server`.
- The API queries (`api/queries/clubs.ts`) have a fallback chain: remote API → local MySQL → in-memory data from `db/clubs-data.ts`.

## Running
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- MySQL starts first (healthcheck-gated).
- The app service runs `npm ci`, `drizzle-kit push` (schema), `tsx db/seed.ts` (seed clubs), then `vite dev --host`.
- `--legacy-peer-deps` is required for npm (peer dependency conflicts in the lock file).

## Environment Variables
- `DATABASE_URL` — set in compose `environment:` (local MySQL, not a user secret)
- `APP_ID` / `APP_SECRET` — declared but not used in dev mode; placeholders in `.env.base44-defaults`, real values via `/run/base44/app.env`

## Database
- Schema: `db/schema.ts` (clubs, ads, announcements tables)
- Seed data: `db/seed.ts` inserts clubs from `db/clubs-data.ts` (skips if table already has rows)
- Migrations: `db/migrations/` (currently empty; `drizzle-kit push` syncs schema directly)

## Key Directories
- `src/pages/` — page components (Home is the main page)
- `src/components/` — UI components (shadcn/ui + app-specific)
- `src/providers/trpc.tsx` — tRPC client setup
- `api/` — Hono backend (boot.ts, router.ts, queries/)
- `db/` — Drizzle schema, seed, clubs data
- `contracts/` — shared types between frontend and backend

## Verification
- After startup, curl `http://localhost:3000/` — should return the Vite HTML shell.
- The tRPC endpoint `http://localhost:3000/api/trpc/ping` should return `{"result":{"data":{"json":{"ok":true,...}}}}`.
- The home page loads clubs from the database (or fallback data if DB is unavailable).
