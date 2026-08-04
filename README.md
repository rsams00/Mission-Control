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

**Phase 4 — Parallelism: done.** Build now runs Backend + Frontend in real, separate git
worktrees with real commits; approving Build performs a real `git merge --no-ff` into the
project's own repo, with conflicts surfaced (never auto-resolved) via a banner in the
approval UI. Phase 5 (the Shipped→Spec loop) is next.

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
    Approving Build performs a real git merge-to-main — see Phase 4.
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

### Phase 2.1 — Dashboard UX refinement — done

Built after Phase 3 (pulled forward at the user's request), once real usage on the user's
own machine surfaced concrete presentation feedback — plus a second round after seeing
design references the user provided. Presentation only, no state-machine/schema changes.

- **Palette overhaul** (`globals.css`, all Tier A UI primitives): replaced the original
  navy/cyan theme with a warm charcoal base (`#121110`) and a single vivid orange/amber
  accent (`#ff7a29`), directly following reference designs the user provided. Every
  component reads the change automatically since they're all built on semantic tokens
  (`bg-surface`, `text-ink-muted`, etc.) rather than hardcoded colors — confirmed via a
  repo-wide grep for stray hex values before starting. Tier B (office view) is untouched by
  design, per the earlier decision to keep it visually distinct.
- **Home page** (`src/app/page.tsx`, new): a real cross-project landing page, separate from
  `/projects` (which stays a pure list + create form) per explicit instruction. Five stat
  tiles (projects, awaiting your approval, shipped, agents active, cost — all live queries,
  not placeholders), a "needs your attention" list across every project, a pipeline-shape
  bar chart, and a cross-project recent-activity feed.
- **Persistent tab bar** (`src/app/projects/[id]/layout.tsx`, `components/project-tabs.tsx`):
  Overview / Roster / Office as real tabs with active-state highlighting, replacing the old
  one-off "Roster" / "Office" link buttons that were duplicated on every page. The shared
  layout also now owns the project header (name, idea, stage badge) so child pages don't
  repeat it.
- **Floating chat widget** (`components/chat-widget.tsx`): project-scoped only — mounted in
  the project layout, so it never appears on the home page or `/projects`, per explicit
  instruction. Launcher → agent picker → inline thread, backed by a new
  `getChatMessagesAction` server action so the picker can load a thread on demand without a
  full page navigation. The dedicated `/chat/[agentId]` page stays alive underneath for
  direct links, unchanged in substance.
- **Two-column detail page**: pipeline + deliverable review as the main column, a live
  roster snapshot (status + last activity, links straight into chat) as a persistent
  sidebar.
- **Real sprite art**: the user's 14 hand-drawn character sheets (front/side/back
  turnarounds) were cropped to isolate the front-facing pose (`sharp`, per-image tuned crop
  regions — layouts weren't uniform enough for one generic crop), then assigned to all 13
  roles — two by an exact filename/agent-name coincidence (`finn`→Support, `iris`→Frontend),
  the rest by visual fit. They replace the placeholder icon badges in the office view
  automatically, no code changes, per the pluggable design from Phase 3.
- **Verified**: production build, and a full headless-browser click-through — home page,
  `/projects` as a genuinely separate page, two-column detail view, all three tabs, the
  chat widget end to end (open → pick agent → send → mock reply renders), real sprites
  rendering in the office view. `pnpm typecheck` and `pnpm lint` clean.

### Phase 3 — Tier B office view — done

Required for v1, not optional. Built directly on Phase 2's existing state — no schema or
state-machine changes.

- **Rooms** (`apps/web/src/app/projects/[id]/office/page.tsx`): one zone per stage type +
  a Lounge, styled as labeled panels rather than a literal top-down floor plan — the
  provided sprite art is front-facing bust portraits, not top-down movement sprites, so
  panels fit the art better than a drawn floor plan would. Room assignment: an agent's role
  is placed in the room matching the project's active stage (`awaiting_approval` /
  `needs_revision`) if their role is one of that stage's assigned roles (reusing
  `STAGE_ROLES`, now exported from `@mission-control/orchestrator`); everyone else sits in
  the Lounge. A project with nothing awaiting approval (freshly created mid-run, or
  Shipped) puts the whole roster in the Lounge.
- **Sprites** (`components/agent-sprite.tsx`): server-rendered, checks
  `apps/web/public/sprites/<role>.png` via `fs.existsSync` on every request and falls back
  to the Tier A icon/color badge if the file isn't there — drop a PNG in, reload, it
  appears, zero code changes. (First version used a client-side `<img onError>` check,
  which turned out to race against hydration in a Server Component tree and never fired;
  moved the check server-side instead — see the component's comment.)
- **Activity log**: a static list of the project's most recent sessions instead of a real
  xterm.js/WebSocket stream — there's no real-time layer yet (see Phase 2 notes above), and
  building one for mock sessions that resolve in ~150ms wouldn't prove anything. Real
  streaming is worth it once Phase 4's sessions actually take time.
- **Palette**: intentionally distinct from Tier A — a warm plum/amber theme scoped to the
  office page via local CSS custom property overrides, not the dashboard's navy/cyan.
- **Verified**: production build, plus a headless-browser click-through across every room
  state — Idea active or Lounge-only, Build's two-agent room, Shipped (everyone in Lounge),
  and the nav link in from both the project page and roster. One real bug found and fixed
  during this pass (the sprite fallback race above).

### Phase 4 — Parallelism — done

Build's two coding roles (Backend, Frontend) now run against a **real local git repo**, not
just mock deliverable content:

- **Worktree manager** (`packages/orchestrator/src/worktree.ts`): a thin `git worktree`
  wrapper. Every project gets its own repo, auto-scaffolded (`git init`, initial commit, a
  `.gitignore` for `.worktrees/`) on first entry to Build, stored at
  `data/repos/<project-id>/` — separate from the Mission Control repo itself, and gitignored
  here at the root (`data/repos/`).
- **Real worktrees + branches**: each coding session gets `git worktree add -b
  build/<role>/<session-id-prefix> <path> main`, and the mock deliverable content is written
  to a file and genuinely committed on that branch inside the worktree — real git objects,
  real SHAs, not simulated.
- **Real merge-to-main on approval**: approving a Build stage checks out `main` and runs `git
  merge --no-ff` for each role's branch, in sequence, *before* the stage is marked approved.
  Only the latest session per agent is merged, so a rejected-and-rerun role's earlier attempt
  is never picked up.
- **Conflicts are surfaced, never auto-resolved**: a failed merge runs `git merge --abort`
  (leaving `main` byte-for-byte untouched) and throws `MergeConflictError`, which propagates
  out of `approveStage` before any state mutates — the stage stays exactly `awaiting_approval`.
  The Server Action catches it and returns `{ ok: false, error }`; `ApprovalControls` renders
  it as a dismissible warning banner above the Approve/Reject buttons, telling the user to
  reject with feedback (re-running Build) or resolve manually in the project's repo.
- **Concurrency capped at 2** (`MAX_CONCURRENT_SESSIONS` in `state-machine.ts`): a hard,
  loud-failing guard — not just an accident of Build being the only multi-role stage today —
  so a future stage adding a third concurrent role fails immediately instead of silently
  exceeding the cost-control cap.
- **Worktrees are cleaned up** after a successful merge (`git worktree remove --force` + a
  filesystem `rm -rf` fallback), so `data/repos/<id>/` only accumulates real commit history,
  not stale working directories.

**Verified**: a dedicated ad hoc conflict test (two worktrees writing conflicting content to
the same file) confirmed all four properties above — conflict detected, `main`'s SHA
unchanged, working tree clean afterward, no partial state — then was deleted once it passed.
The happy path was verified twice via `pnpm orchestrator:demo` (real branches, real commits,
real two-way merge, clean removal — inspected with `git log --graph --all`, `git worktree
list`, `git ls-tree -r main`) and once end-to-end through the actual dashboard UI with a
headless-browser script: created a project, approved through to Build, approved Build itself
(triggering the real merge), and confirmed the stage advanced to Test with no console errors
and no stuck state. Production build and typecheck/lint are clean.

### Phase 5 — The loop — planned

`Shipped → Spec` inserts a new stage row with `cycle = previous + 1`, so shipped projects
support ongoing iteration with full history preserved per cycle.

## Structure

```
apps/
  web/                   Next.js (App Router) — the Tier A dashboard
    src/app/page.tsx         home page — portfolio stats, needs-attention, activity, distribution
    src/app/globals.css      charcoal + orange/amber design tokens (Rev. 4, Phase 2.1)
    src/app/projects/        /projects (list+create, separate from home) and /projects/[id]/*
      [id]/layout.tsx           shared header, ProjectTabs, ChatWidget — wraps all child routes
      [id]/office/              Tier B — untouched by the Phase 2.1 palette overhaul
    public/sprites/           real per-role character art (14 sheets, cropped + assigned)
    src/components/           StagePipeline, DeliverableViewer, ApprovalControls, ChatPanel,
                               ChatWidget (floating, project-scoped), ProjectTabs, StatTile,
                               OfficeRoom, AgentSprite (server-rendered, fs-based fallback),
                               ui/ (Button, Card, Badge, Textarea — hand-written shadcn-style)
    src/lib/data.ts           Server Component data access (reads @mission-control/db)
    src/lib/actions.ts        Server Actions (calls @mission-control/orchestrator)
    src/lib/agent-identity.ts   per-role color + icon, used across roster/chat/pipeline/office
packages/
  orchestrator/          Long-running Node/TS process — roster, state machine, sessions
    src/roster.ts           13-role roster config + idempotent seeding
    src/state-machine.ts    createProject / approveStage / rejectStage
    src/session-runner.ts   mock-vs-real session dispatch (mock is default; real throws)
    src/mock-fixtures.ts    canned per-stage deliverable content for mock mode
    src/worktree.ts         git worktree manager — real repos/branches/merges (Phase 4)
    src/cli/                seed.ts, demo.ts, poc.ts — runnable scripts, no UI yet
  db/                     Drizzle schema + migrations (single source of truth, 7 tables)
  shared/                 Shared TS types (stage/agent/session enums, etc.)
data/
  repos/                  gitignored — one real git repo per project, auto-scaffolded on
                           first Build entry (Phase 4)
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
pnpm dev   # http://localhost:3000 — the home page (portfolio overview)
```

The home page shows stats, what needs your approval, and recent activity across every
project. Click **Projects** to create one — Idea starts automatically. From inside a
project, use the **Overview / Roster / Office** tabs to move around, and the chat bubble
(bottom-right) to message any agent without leaving the page. Every session behind this is
mock — the header's "mock mode" badge is always visible as a reminder. Nothing here calls
the real Agent SDK.

To add real sprite art: drop PNGs named `<role>.png` (see
`apps/web/public/sprites/README.md` for the exact role slugs) into that folder and reload —
no code changes needed.

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
