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
import { seedRoster } from "@mission-control/orchestrator";

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
