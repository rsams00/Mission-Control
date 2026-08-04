# Mission Control

A platform that runs a team of specialized Claude agents through the full SDLC — from a
one-line idea to a shipped, tested MVP, and the loop after — coordinated through one
interface with a human approval gate at every handoff.

Full plan: see the published build brief artifact (data model, roster, state machine, UI
tiers, phase plan).

## Status

**Phase 0 — Plumbing.** Monorepo scaffolded, schema migrated, one streamed Agent SDK
session confirmed working. No orchestrator logic, no UI yet.

## Structure

```
apps/
  web/                 Next.js (App Router) — frontend + API route handlers (Phase 2+)
packages/
  orchestrator/         Long-running Node/TS process — Agent SDK session lifecycle
  db/                   Drizzle schema + migrations (single source of truth, 7 tables)
  shared/                Shared TS types (stage/agent/session enums, etc.)
```

## Setup

Requires Node >= 20 and pnpm.

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL / ANTHROPIC_API_KEY
```

### Database

**This environment** (no Docker daemon available) uses the preinstalled Postgres 16
cluster directly:

```bash
service postgresql start
# one-time: create the mission_control role + database (see packages/db/README notes
# below if you need to recreate them)
```

**Your own machine**, via Docker Compose:

```bash
docker compose up -d
```

Either way, once Postgres is reachable at `DATABASE_URL`:

```bash
pnpm db:generate   # regenerate SQL from packages/db/src/schema.ts after a schema change
pnpm db:migrate    # apply migrations
```

### Agent SDK proof-of-concept

Confirms a session can run and stream output — no DB wiring yet, that's Phase 1.

```bash
pnpm orchestrator:poc
```

In this sandbox, `@anthropic-ai/claude-agent-sdk` picks up this Claude Code session's own
credentials automatically — no `ANTHROPIC_API_KEY` needed here. On your own machine, set
`ANTHROPIC_API_KEY` in `.env` first.

## Scripts

| Command | Does |
|---|---|
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm orchestrator:poc` | Run the Phase 0 streaming proof-of-concept |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm typecheck` | TypeScript project check across all packages |
