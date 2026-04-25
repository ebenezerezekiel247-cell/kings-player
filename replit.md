# Kings Player — Gaming Marketplace

## Overview

Kings Player is a gaming marketplace (similar to Eldorado.gg) where users can buy and sell gaming accounts, items, currency, and boosting services. Sellers are contacted via Discord. Built as a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (`artifacts/kings-player`) — dark gaming theme (slate+gold)
- **API framework**: Express 5 (`artifacts/api-server`)
- **Database**: Turso (LibSQL/SQLite) + Drizzle ORM (`lib/db`) — migrated from Replit PostgreSQL
- **Auth**: Clerk (`@clerk/react` v6, `@clerk/express`) with proxy at `/api/__clerk`
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **API client**: `@workspace/api-client-react` (generated React Query hooks)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod schemas from OpenAPI spec
  - **CRITICAL**: After codegen, overwrite `lib/api-zod/src/index.ts` to only `export * from "./generated/api";`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Project Structure

```
artifacts/
  api-server/          Express API server
    src/routes/        listings, comments, users, categories, health
    src/middlewares/   requireAuth, clerkProxyMiddleware
  kings-player/        React+Vite frontend
    src/pages/         home, browse, listing, create, dashboard, profile, not-found
    src/components/    Navbar, ListingCard, ui/ (shadcn components)
lib/
  api-spec/            OpenAPI spec (openapi.yaml)
  api-client-react/    Generated React Query hooks
  api-zod/             Generated Zod schemas
  db/                  Drizzle schema + seed data
    src/schema/        users, listings, comments, categories tables
```

## Features

- Landing page with hero, stats, categories, featured listings
- Marketplace browse with search, filter by category/game/price, sort
- Listing detail page with Discord contact info and comments
- Create listing form (auth-gated)
- Seller dashboard with listing management and status updates
- Seller profile pages
- Clerk authentication (sign in / sign up pages)

## Environment Variables

- `CLERK_SECRET_KEY` — Clerk secret key (set in secrets)
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key (set in secrets)
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key for Vite frontend
- `SESSION_SECRET` — Express session secret
- `DATABASE_URL` — PostgreSQL connection string

## Seed Data

5 sample listings across Valorant, Diablo IV, WoW Classic, Fortnite, Apex Legends with 2 seed users (KingSlayer99, VoidWalker).
