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

**Phase 2 — Tier A dashboard: done.** There's a real, clickable UI now — create a project,
approve/reject deliverables, browse the roster, chat with any agent — all running against
mock mode at $0. See "Try the dashboard" below to run it yourself. Phase 3 (Tier B office
view) is next.

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

### Phase 2 — Tier A dashboard — done

Project list, stage pipeline view, deliverable viewer, approve/reject controls, per-agent
chat, org-chart roster page with live activity snippets. Dark mission-control theme,
Tailwind CSS + hand-written shadcn-style primitives (Button, Card, Badge, Textarea on
Radix + cva). This is where mock mode became visually testable end to end, not just via
scripts.

- **Routes**: `/projects` (list + create), `/projects/[id]` (pipeline, deliverable viewer,
  approve/reject), `/projects/[id]/roster` (org-chart-style roster with live activity
  snippets), `/projects/[id]/chat/[agentId]` (persistent per-agent chat)
- **Data layer** (`apps/web/src/lib/data.ts`, `actions.ts`): Server Components read
  straight from `@mission-control/db`; Server Actions call `@mission-control/orchestrator`'s
  `createProject` / `approveStage` / `rejectStage` directly — no separate API layer or
  running orchestrator process yet, since mock sessions resolve in ~150ms. A standalone
  long-running orchestrator process becomes necessary once Phase 4's real worktree sessions
  need lifecycle management beyond a single request.
- **No WebSocket layer yet** — approve/reject/chat just refetch after the action completes,
  which is enough while every session is mock and near-instant. Real-time streaming
  (Socket.IO, per the original plan) becomes worth the complexity once Phase 2's mock
  sessions are replaced by real ones that take longer than a page load.
- A permanent **"mock mode" badge** sits in the header so it's always visible which mode
  you're in — a UI-level reflection of the cost policy above, not just a doc note.
- **Verified**: dev server built and run with `pnpm build` (production) and `pnpm dev`
  (dev), then clicked through end to end with a headless-browser script — create project →
  approve Idea → reject Spec with feedback → confirm re-queue and both sessions' deliverables
  show → roster page → chat with an agent → confirm the mock reply round-trips. No console
  errors. `pnpm typecheck` and `pnpm lint` pass clean across all 4 packages.

### Phase 3 — Tier B office view — next

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
  web/                   Next.js (App Router) — the Tier A dashboard
    src/app/globals.css     dark mission-control design tokens (colors, type, per-role)
    src/app/projects/       routes: list+create, detail, roster, chat
    src/components/          StagePipeline, DeliverableViewer, ApprovalControls, ChatPanel,
                              ui/ (Button, Card, Badge, Textarea — hand-written shadcn-style)
    src/lib/data.ts          Server Component data access (reads @mission-control/db)
    src/lib/actions.ts       Server Actions (calls @mission-control/orchestrator)
    src/lib/agent-identity.ts  per-role color + icon, used across roster/chat/pipeline
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

### Try the dashboard (mock mode, $0)

```bash
pnpm dev   # http://localhost:3000 — redirects to /projects
```

Create a project, watch Idea start automatically, approve or reject each stage's
deliverable, browse the roster, chat with any agent. Every session behind this is mock —
the header's "mock mode" badge is always visible as a reminder. Nothing here calls the real
Agent SDK.

### Try just the state machine (mock mode, $0, no UI)

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
| `pnpm dev` | Run the Tier A dashboard at localhost:3000 | No |
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema | No |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` | No |
| `pnpm orchestrator:seed` | Seed the 13-role agent roster | No |
| `pnpm orchestrator:demo` | Walk a project through the full pipeline in mock mode | No |
| `pnpm orchestrator:poc` | Phase 0 streaming proof-of-concept | **Yes** |
| `pnpm lint` | ESLint across the monorepo | No |
| `pnpm typecheck` | TypeScript project check across all packages | No |
| `pnpm --filter @mission-control/web build` | Production build of the dashboard | No |
