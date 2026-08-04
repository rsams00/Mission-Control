import { eq } from "drizzle-orm";
import { db, agent } from "@mission-control/db";
import type { AgentRole } from "@mission-control/shared";

export interface RosterEntry {
  role: AgentRole;
  name: string;
  systemPrompt: string;
  toolScope: Record<string, unknown>;
  model: string;
  /** Whether this role is active on a new project by default. */
  coreTeam: boolean;
}

const OPUS = "claude-opus-5";
const SONNET = "claude-sonnet-5";
const HAIKU = "claude-haiku-4-5-20251001";

// Names are placeholder seed data, not a design decision — rename freely by
// editing the agent table, no code depends on the string values.
export const ROSTER: RosterEntry[] = [
  {
    role: "orchestrator",
    name: "Vega",
    systemPrompt:
      "You are the Orchestrator. You coordinate the project across all stages: summarize " +
      "current status, and recommend which agent should act next. You never write code or " +
      "deliverables yourself — you only read project state.",
    toolScope: { tools: ["ReadProjectState"], codeTools: false },
    model: OPUS,
    coreTeam: true,
  },
  {
    role: "product",
    name: "Marlowe",
    systemPrompt:
      "You are the Product Strategist. Turn a one-line idea into a PRD: goals, non-goals, " +
      "P0/P1/P2 requirements, and acceptance criteria.",
    toolScope: { tools: ["WebSearch", "Write"], codeTools: false },
    model: OPUS,
    coreTeam: true,
  },
  {
    role: "architect",
    name: "Ada",
    systemPrompt:
      "You are the Architect. Turn an approved PRD into a system design: architecture, data " +
      "model, API contracts, and stack decisions.",
    toolScope: { tools: ["Read", "Write"], codeTools: false },
    model: OPUS,
    coreTeam: true,
  },
  {
    role: "backend",
    name: "Rex",
    systemPrompt:
      "You are the Backend Engineer. Implement server code, DB migrations, and API endpoints " +
      "against the approved architecture, in your own git worktree.",
    toolScope: { tools: ["Read", "Write", "Edit", "Bash"], worktree: true },
    model: SONNET,
    coreTeam: true,
  },
  {
    role: "frontend",
    name: "Iris",
    systemPrompt:
      "You are the Frontend Engineer. Implement UI code against the approved architecture, in " +
      "your own git worktree.",
    toolScope: { tools: ["Read", "Write", "Edit", "Bash"], worktree: true },
    model: SONNET,
    coreTeam: true,
  },
  {
    role: "qa",
    name: "Wren",
    systemPrompt:
      "You are the QA / Test Engineer. Write and run a test suite against the built code, and " +
      "report pass/fail results and a bug list. You may only write to test files.",
    toolScope: { tools: ["Read", "Bash"], writeScope: "tests-only" },
    model: SONNET,
    coreTeam: true,
  },
  {
    role: "docs",
    name: "Quill",
    systemPrompt:
      "You are the Docs Writer. Write the README, API docs, and changelog for tested code. " +
      "You may only write documentation files.",
    toolScope: { tools: ["Read", "Write"], writeScope: "docs-only" },
    model: HAIKU,
    coreTeam: true,
  },
  {
    role: "researcher",
    name: "Dana",
    systemPrompt:
      "You are the Researcher. Investigate competitive and technical context before Spec work " +
      "begins.",
    toolScope: { tools: ["WebSearch", "Read"], codeTools: false },
    model: SONNET,
    coreTeam: false,
  },
  {
    role: "designer",
    name: "Juno",
    systemPrompt: "You are the UX/Product Designer. Produce flows and wireframes.",
    toolScope: { tools: ["Read", "Write"], codeTools: false },
    model: SONNET,
    coreTeam: false,
  },
  {
    role: "devops",
    name: "Cole",
    systemPrompt: "You are DevOps/Infra. Handle deployment beyond local dev.",
    toolScope: { tools: ["Read", "Write", "Bash"], codeTools: true },
    model: SONNET,
    coreTeam: false,
  },
  {
    role: "security",
    name: "Sable",
    systemPrompt: "You are the Security Reviewer. Review the project for security issues before Build.",
    toolScope: { tools: ["Read", "Bash"], codeTools: false },
    model: SONNET,
    coreTeam: false,
  },
  {
    role: "growth",
    name: "Remy",
    systemPrompt:
      "You are Growth/Analytics. Post-launch, propose the next iteration from usage data.",
    toolScope: { tools: ["Read"], codeTools: false },
    model: HAIKU,
    coreTeam: false,
  },
  {
    role: "support",
    name: "Finn",
    systemPrompt: "You are Support/Triage. Post-launch, surface and prioritize incoming bug reports.",
    toolScope: { tools: ["Read"], codeTools: false },
    model: HAIKU,
    coreTeam: false,
  },
];

/** Idempotent: inserts any roster entries not already present by role. */
export async function seedRoster(): Promise<void> {
  const existing = await db.select({ role: agent.role }).from(agent);
  const existingRoles = new Set(existing.map((row) => row.role));

  const missing = ROSTER.filter((entry) => !existingRoles.has(entry.role));
  if (missing.length === 0) return;

  await db.insert(agent).values(
    missing.map((entry) => ({
      role: entry.role,
      name: entry.name,
      systemPrompt: entry.systemPrompt,
      toolScope: entry.toolScope,
      model: entry.model,
      active: true,
    })),
  );
}

export async function getAgentByRole(role: AgentRole) {
  const rows = await db.select().from(agent).where(eq(agent.role, role)).limit(1);
  return rows[0];
}
