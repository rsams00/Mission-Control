# Mission Control

A platform that runs a team of specialized Claude agents through the full SDLC — from a
one-line idea to a shipped, tested MVP, and the loop after — coordinated through one
interface, with a live visual office view of the whole team, and a human approval gate at
every handoff.

Full plan: see the published build brief artifact (data model, roster, state machine, UI
tiers, phase plan).

## Core concept

```
Idea → Spec → Architecture → Build → Test → Docs → Shipped
                                ↑___________________|
                          (new features loop back to Spec)
```

Every arrow is a gate — nothing advances without an explicit approval. A fixed roster of 13
agent roles (Orchestrator, Product, Architect, Backend, Frontend, QA, Docs, plus six
add-as-needed specialists) each run as their own Agent SDK session, differentiated by
system prompt, tool scope, and model — not separate systems. Chat with any agent persists
independently of stage status, so context carries across the whole project lifetime.

## Status

**Phase 1 — Orchestrator core: done.** The state machine, approval gates, and rejection
flow are real and verified end to end. **No UI yet** — everything below is exercised
through scripts against the database directly. Phase 2 (Tier A dashboard) is next.

### Cost policy

**No real (paid) API calls happen anywhere in this repo's build/dev process.** Every script
here (`orchestrator:demo`, future orchestrator work) runs in **mock mode** by default —
canned fixture responses stand in for real Agent SDK sessions, at $0. The real session path
(`packages/orchestrator/src/session-runner.ts`) is deliberately left unimplemented — it
throws if called — specifically so nothing can spend real API credit by accident. It only
gets implemented once an `ANTHROPIC_API_KEY` is provided and a real test run is explicitly
requested.

The one exception already spent: the Phase 0 proof-of-concept (`orchestrator:poc`) made one
real streamed call (~$0.19) to prove the Agent SDK integration works, before this policy was
set. It has not been re-run since, and won't be, until asked for.

## Phases

### Phase 0 — Plumbing — done

Proved the spine works before building anything on top of it.

- Monorepo scaffolded: `apps/web` (Next.js), `packages/orchestrator`, `packages/db`,
  `packages/shared` (pnpm workspaces)
- Postgres 16 running natively in this environment; `mission_control` db/role created;
  `docker-compose.yml` written for local-machine dev (no Docker daemon here)
- Drizzle schema for all 7 core tables (`project`, `stage`, `agent`, `project_agent`,
  `session`, `deliverable`, `chat_message`) migrated and verified against the live database
- One hardcoded-prompt Agent SDK session streamed real output to console — confirmed
  working (this is the one real API call spent so far, see Cost policy above)
- `pnpm typecheck` and `pnpm lint` pass clean across all packages

### Phase 1 — Orchestrator core — done

The state machine and gate logic are real, even with no UI yet.

- **Roster** (`packages/orchestrator/src/roster.ts`): all 13 roles seeded with name, system
  prompt, tool scope, and default model (Opus 5 for Orchestrator/Product/Architect, Sonnet 5
  for Backend/Frontend/QA, Haiku 4.5 for Docs). `seedRoster()` is idempotent.
- **State machine** (`src/state-machine.ts`):
  - `createProject()` auto-creates the Idea stage, seeds `project_agent` rows (core team
    active, add-as-needed roles present but inactive), and starts the first stage
  - `approveStage()` records the approval, blocks if the stage isn't `awaiting_approval`,
    and creates + starts the next stage. Approving Docs marks the project `Shipped`.
    Approving Build logs that merge-to-main is a Phase 4 capability (not yet real).
  - `rejectStage()` writes rejection feedback as a `chat_message`
    (`is_rejection_feedback = true`), sets `needs_revision`, and re-runs the same agent(s)
    with that feedback as context
- **Mock mode** (`src/session-runner.ts`, `src/mock-fixtures.ts`): `MISSION_CONTROL_MOCK`
  defaults to mock (see Cost policy). Canned per-stage-type fixture deliverables stand in
  for real agent output.
- **Verified**: `pnpm orchestrator:demo` walks a project through Idea → Shipped, including
  one rejection/re-queue, entirely in mock mode. Confirmed against the live database:
  6 stages all `approved`, 8 sessions all `completed` (Idea ran twice due to the rejection,
  Build ran twice for Backend + Frontend), one rejection-feedback chat message recorded. A
  separate check confirmed `approveStage()` throws on a stage that isn't `awaiting_approval`.

### Phase 2 — Tier A dashboard — next

Project list, stage pipeline view, deliverable viewer, approve/reject controls, per-agent
chat, org-chart roster page with live activity snippets. Dark mission-control theme,
Tailwind + shadcn/ui. This is where mock mode becomes visually testable end to end, not just
via scripts.

### Phase 3 — Tier B office view — planned

Required for v1, not optional. Pixel-art top-down office, one room per stage + a Lounge for
idle agents, sprite-per-agent (art provided by the user). Ships before Parallelism — Build's
room shows one active sprite until Phase 4 adds real concurrency.

### Phase 4 — Parallelism — planned

Build stage runs Backend + Frontend concurrently in separate git worktrees. Approving Build
merges both branches straight into the project's main branch; conflicts are surfaced, never
auto-resolved. Concurrency capped at 2. Once live, the Phase 3 office view shows both
Backend and Frontend sprites in the Build room at once.

### Phase 5 — The loop — planned

`Shipped → Spec` inserts a new stage row with `cycle = previous + 1`, so shipped projects
support ongoing iteration with full history preserved per cycle.

## Structure

```
apps/
  web/                   Next.js (App Router) — frontend + API route handlers (Phase 2+)
packages/
  orchestrator/          Long-running Node/TS process — roster, state machine, sessions
    src/roster.ts           13-role roster config + idempotent seeding
    src/state-machine.ts    createProject / approveStage / rejectStage
    src/session-runner.ts   mock-vs-real session dispatch (mock is default; real throws)
    src/mock-fixtures.ts    canned per-stage deliverable content for mock mode
    src/cli/                seed.ts, demo.ts, poc.ts — runnable scripts, no UI yet
  db/                     Drizzle schema + migrations (single source of truth, 7 tables)
  shared/                 Shared TS types (stage/agent/session enums, etc.)
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
# one-time: create the mission_control role + database
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

### Try the state machine (mock mode, $0)

```bash
pnpm orchestrator:seed   # seed the 13-role roster (idempotent)
pnpm orchestrator:demo   # create a project, walk it through Idea -> Shipped, including
                          # one rejection/re-queue — all mock, no API calls
```

### Agent SDK streaming proof-of-concept (Phase 0, real call — do not re-run casually)

```bash
pnpm orchestrator:poc
```

This is the one script in the repo that makes a **real, paid** API call. It's already been
run once (see Cost policy above). Don't re-run it without a reason — mock mode
(`orchestrator:demo`) is what everything else uses.

## Scripts

| Command | Does | Real API calls? |
|---|---|---|
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema | No |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` | No |
| `pnpm orchestrator:seed` | Seed the 13-role agent roster | No |
| `pnpm orchestrator:demo` | Walk a project through the full pipeline in mock mode | No |
| `pnpm orchestrator:poc` | Phase 0 streaming proof-of-concept | **Yes** |
| `pnpm lint` | ESLint across the monorepo | No |
| `pnpm typecheck` | TypeScript project check across all packages | No |
