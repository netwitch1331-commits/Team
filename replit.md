# Studio Sync — Team Meeting Calendar

A team meeting calendar for creative studio employees. Schedule meetings, detect scheduling conflicts, browse a week-view grid, and manage your team directory.

## Run & Operate

- `pnpm --filter @workspace/meeting-calendar run dev` — run the frontend (port 24414)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Wouter routing, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — `employees.ts`, `meetings.ts` (Drizzle schema)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validators (used by server routes)
- `artifacts/api-server/src/routes/` — `employees.ts`, `meetings.ts`, route handlers
- `artifacts/meeting-calendar/src/` — React frontend
  - `pages/` — home, week, new, meeting, employees, search
  - `components/` — layout (sidebar), meeting-card, avatar

## Architecture decisions

- OpenAPI-first: all API contracts live in `openapi.yaml`, types/hooks generated via Orval
- `/meetings/today` and `/meetings/week` are dedicated endpoints (not query params) for cleaner client hooks
- Conflict detection runs both on the server at create-time (409) and optionally pre-checked client-side via `/meetings/check-conflict`
- Meeting participants stored in a separate `meeting_participants` join table with cascade delete

## Product

- **Today view** (`/`) — today's meetings as cards with times, location, participant avatars
- **Week view** (`/week`) — 7-column time grid (8:00–20:00), meetings as positioned blocks
- **New meeting** (`/new`) — form with conflict check before submission
- **Meeting detail** (`/meetings/:id`) — full details + delete with confirmation
- **Employee directory** (`/employees`) — team grid with colored avatar initials
- **Search** (`/search`) — filter meetings by date range

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run codegen before editing routes or frontend
- `@import url(...)` for Google Fonts must be the FIRST line in `index.css` (before Tailwind imports) or PostCSS throws an error
- Hook query options require `queryKey` when passing a `query` object to `useGetMeeting` / `useListMeetings`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
