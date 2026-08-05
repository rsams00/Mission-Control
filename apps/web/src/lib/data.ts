import "server-only";
import { desc, eq, and } from "drizzle-orm";
import {
  db,
  project,
  stage,
  session,
  deliverable,
  chatMessage,
  projectAgent,
  agent,
} from "@mission-control/db";
import { seedRoster, STAGE_ROLES } from "@mission-control/orchestrator";
import type { StageType } from "@mission-control/shared";

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  await seedRoster();
  seeded = true;
}

export async function listProjects() {
  await ensureSeeded();
  return db.select().from(project).orderBy(desc(project.createdAt));
}

export async function getProject(projectId: string) {
  await ensureSeeded();
  const [row] = await db.select().from(project).where(eq(project.id, projectId)).limit(1);
  return row;
}

export async function getProjectStages(projectId: string) {
  return db.select().from(stage).where(eq(stage.projectId, projectId)).orderBy(stage.startedAt);
}

export async function getStageSessions(stageId: string) {
  return db
    .select({ session, agent })
    .from(session)
    .innerJoin(agent, eq(session.agentId, agent.id))
    .where(eq(session.stageId, stageId));
}

export async function getStageDeliverables(stageId: string) {
  return db.select().from(deliverable).where(eq(deliverable.stageId, stageId));
}

export async function getProjectRoster(projectId: string) {
  await ensureSeeded();
  return db
    .select({ agent, projectAgent })
    .from(projectAgent)
    .innerJoin(agent, eq(projectAgent.agentId, agent.id))
    .where(eq(projectAgent.projectId, projectId))
    .orderBy(agent.role);
}

export async function getAgent(agentId: string) {
  const [row] = await db.select().from(agent).where(eq(agent.id, agentId)).limit(1);
  return row;
}

export async function getChatMessages(projectId: string, agentId: string) {
  return db
    .select()
    .from(chatMessage)
    .where(and(eq(chatMessage.projectId, projectId), eq(chatMessage.agentId, agentId)))
    .orderBy(chatMessage.createdAt);
}

/**
 * The stage currently awaiting attention (awaiting_approval or
 * needs_revision), if any — used by the office view to decide which room
 * is "active" right now. A project with nothing awaiting approval (just
 * created, or Shipped) has no active stage, so every agent sits in the
 * Lounge.
 */
export async function getActiveStage(projectId: string) {
  const stages = await getProjectStages(projectId);
  return stages.find((s) => s.status === "awaiting_approval" || s.status === "needs_revision");
}

/** Most recent session per agent for a project, used for roster activity snippets. */
export async function getLatestSessionsByAgent(projectId: string) {
  const rows = await db
    .select({ session, stage, agent })
    .from(session)
    .innerJoin(stage, eq(session.stageId, stage.id))
    .innerJoin(agent, eq(session.agentId, agent.id))
    .where(eq(stage.projectId, projectId))
    .orderBy(desc(session.startedAt));

  const latestByAgent = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByAgent.has(row.agent.id)) latestByAgent.set(row.agent.id, row);
  }
  return latestByAgent;
}

/**
 * Recent session events across the whole project, newest first — feeds the
 * office view's activity log. This is a static snapshot, not a live stream:
 * there's no WebSocket/real-time layer yet (see README), which is fine
 * while every session is mock and resolves in ~150ms.
 */
export async function getRecentActivity(projectId: string, limit = 12) {
  return db
    .select({ session, stage, agent })
    .from(session)
    .innerJoin(stage, eq(session.stageId, stage.id))
    .innerJoin(agent, eq(session.agentId, agent.id))
    .where(eq(stage.projectId, projectId))
    .orderBy(desc(session.startedAt))
    .limit(limit);
}

/** Every stage, across every project, currently sitting in awaiting_approval
 * or needs_revision — the home page's "needs your attention" list. */
export async function getNeedsAttention() {
  await ensureSeeded();
  const rows = await db
    .select({ stage, project })
    .from(stage)
    .innerJoin(project, eq(stage.projectId, project.id))
    .orderBy(desc(stage.startedAt));
  return rows.filter((r) => r.stage.status === "awaiting_approval" || r.stage.status === "needs_revision");
}

/** Cross-project version of getRecentActivity, for the home page feed. */
export async function getPortfolioActivity(limit = 10) {
  return db
    .select({ session, stage, project, agent })
    .from(session)
    .innerJoin(stage, eq(session.stageId, stage.id))
    .innerJoin(project, eq(stage.projectId, project.id))
    .innerJoin(agent, eq(session.agentId, agent.id))
    .orderBy(desc(session.startedAt))
    .limit(limit);
}

/** How many projects currently sit in each pipeline stage — home page's
 * portfolio-shape tile. */
export async function getPipelineDistribution() {
  await ensureSeeded();
  const rows = await db.select({ currentStage: project.currentStage }).from(project);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.currentStage, (counts.get(row.currentStage) ?? 0) + 1);
  }
  return counts;
}

/**
 * Portfolio-wide headline numbers for the home page: total projects, how
 * many need approval right now, how many have shipped, how many distinct
 * agents are currently active across all projects, and a running cost
 * total (always $0 in mock mode — see README's cost policy).
 */
export async function getPortfolioStats() {
  await ensureSeeded();
  const [allProjects, needsAttention, allSessions] = await Promise.all([
    listProjects(),
    getNeedsAttention(),
    db.select({ session, stage }).from(session).innerJoin(stage, eq(session.stageId, stage.id)),
  ]);

  const attentionProjectIds = new Set(needsAttention.map((r) => r.project.id));
  const shippedCount = allProjects.filter((p) => p.currentStage === "shipped").length;

  const activeAgentIds = new Set(
    allSessions
      .filter((r) => r.stage.status === "awaiting_approval" || r.stage.status === "needs_revision")
      .map((r) => r.session.agentId),
  );

  let totalCostUsd = 0;
  for (const { session: s } of allSessions) {
    const usage = s.tokenUsage as { cost_usd?: number } | null;
    totalCostUsd += usage?.cost_usd ?? 0;
  }

  return {
    totalProjects: allProjects.length,
    awaitingApprovalCount: attentionProjectIds.size,
    shippedCount,
    activeAgentCount: activeAgentIds.size,
    totalCostUsd,
    totalSessions: allSessions.length,
  };
}

export type OfficePresence = "active" | "waiting" | "idle";

export interface OfficeAssignment {
  projectId: string;
  projectName: string;
  stageType: StageType;
  stageStatus: string;
  presence: OfficePresence;
}

/**
 * Cross-project room assignment for the global Office view (Phase 3.1).
 * Every agent role is one persistent identity, so if the same role is
 * "active" on more than one project at once — possible in principle, even
 * though today's usage is one project at a time — the most recently
 * started stage wins; that's the room they're shown in.
 *
 * A room occupant is now derived from `in_progress` stages too, not just
 * `awaiting_approval`/`needs_revision` — a stage genuinely running sessions
 * is when an agent should first appear in their room, not only once their
 * output is sitting there awaiting your review. `presence` distinguishes
 * "active" (a session is actually running right now) from "waiting"
 * (sessions finished, the stage is sitting in your approval queue) — mock
 * sessions resolve in ~150ms so "active" will rarely be observed today,
 * but the distinction is real and ready for when sessions take longer.
 */
export async function getGlobalOfficeState() {
  await ensureSeeded();
  const [allAgents, occupiedStageRows] = await Promise.all([
    db.select().from(agent).orderBy(agent.role),
    db
      .select({ stage, project })
      .from(stage)
      .innerJoin(project, eq(stage.projectId, project.id))
      .orderBy(desc(stage.startedAt)),
  ]);

  const relevant = occupiedStageRows.filter((r) =>
    ["in_progress", "awaiting_approval", "needs_revision"].includes(r.stage.status),
  );

  const runningSessionRows =
    relevant.length === 0
      ? []
      : await db
          .select({ agentId: session.agentId, stageId: session.stageId })
          .from(session)
          .where(and(eq(session.status, "running")));
  const runningKeys = new Set(runningSessionRows.map((r) => `${r.stageId}:${r.agentId}`));

  const agentByRole = new Map(allAgents.map((a) => [a.role, a]));
  const assignmentByRole = new Map<string, OfficeAssignment>();
  for (const { stage: s, project: p } of relevant) {
    for (const role of STAGE_ROLES[s.type]) {
      if (assignmentByRole.has(role)) continue; // already claimed by a more-recent stage
      const roleAgent = agentByRole.get(role);
      const isRunning = roleAgent ? runningKeys.has(`${s.id}:${roleAgent.id}`) : false;
      assignmentByRole.set(role, {
        projectId: p.id,
        projectName: p.name,
        stageType: s.type,
        stageStatus: s.status,
        presence: isRunning ? "active" : "waiting",
      });
    }
  }

  return allAgents.map((a) => ({
    agent: a,
    assignment: assignmentByRole.get(a.role) ?? null,
  }));
}

/**
 * Daily session counts for the last N days, oldest first — feeds the home
 * page's activity sparkline. Real query over real session rows; mock mode
 * just means every count so far reflects mock (near-instant, $0) sessions
 * rather than real ones — the shape of the query doesn't change once real
 * sessions exist.
 */
export async function getSessionActivitySparkline(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ startedAt: session.startedAt })
    .from(session)
    .where(and(eq(session.status, "completed")));

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    if (!row.startedAt || row.startedAt < since) continue;
    const key = row.startedAt.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

/** Every agent's total completed-session count across every project,
 * busiest first — feeds the home page's "top active agents" mini
 * leaderboard, filling out the Session Activity card below the sparkline. */
export async function getTopActiveAgents(limit = 4) {
  const rows = await db
    .select({ agent, session })
    .from(session)
    .innerJoin(agent, eq(session.agentId, agent.id))
    .where(eq(session.status, "completed"));

  const countByAgent = new Map<string, { agent: (typeof rows)[number]["agent"]; count: number }>();
  for (const row of rows) {
    const existing = countByAgent.get(row.agent.id);
    if (existing) existing.count += 1;
    else countByAgent.set(row.agent.id, { agent: row.agent, count: 1 });
  }

  return Array.from(countByAgent.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** One agent's cross-project footprint for the profile panel: every session
 * they've run and every project they've touched, newest first. */
export async function getAgentActivity(agentId: string) {
  const rows = await db
    .select({ session, stage, project })
    .from(session)
    .innerJoin(stage, eq(session.stageId, stage.id))
    .innerJoin(project, eq(stage.projectId, project.id))
    .where(eq(session.agentId, agentId))
    .orderBy(desc(session.startedAt))
    .limit(20);

  const projectIds = new Set(rows.map((r) => r.project.id));
  return { sessions: rows, projectCount: projectIds.size };
}
