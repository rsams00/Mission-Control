import { desc, eq } from "drizzle-orm";
import { db, project, stage, session, deliverable, chatMessage, projectAgent, agent } from "@mission-control/db";
import type { AgentRole, StageType } from "@mission-control/shared";
import { STAGE_TYPES } from "@mission-control/shared";
import { ROSTER, getAgentByRole } from "./roster";
import { runSession } from "./session-runner";

// idea -> spec -> architecture -> build -> test -> docs -> (shipped)
const STAGE_ORDER: StageType[] = [...STAGE_TYPES];

function nextStageType(current: StageType): StageType | "shipped" {
  const index = STAGE_ORDER.indexOf(current);
  return STAGE_ORDER[index + 1] ?? "shipped";
}

// Idea and Spec are both owned by Product; Build needs both coding roles.
// Exported for the Tier B office view, which needs the same stage->role
// mapping to decide which room an agent's sprite belongs in.
export const STAGE_ROLES: Record<StageType, AgentRole[]> = {
  idea: ["product"],
  spec: ["product"],
  architecture: ["architect"],
  build: ["backend", "frontend"],
  test: ["qa"],
  docs: ["docs"],
};

export class GateError extends Error {}

export async function createProject(params: { name: string; oneLineIdea: string }) {
  const [newProject] = await db
    .insert(project)
    .values({ name: params.name, oneLineIdea: params.oneLineIdea, currentStage: "idea", status: "active" })
    .returning();
  if (!newProject) throw new Error("failed to create project");

  // Core team active by default; "add as needed" roles present but inactive.
  const allAgents = await db.select().from(agent);
  await db.insert(projectAgent).values(
    allAgents.map((row) => {
      const rosterEntry = ROSTER.find((entry) => entry.role === row.role);
      return {
        projectId: newProject.id,
        agentId: row.id,
        active: rosterEntry?.coreTeam ?? false,
      };
    }),
  );

  const [ideaStage] = await db
    .insert(stage)
    .values({ projectId: newProject.id, type: "idea", cycle: 0, status: "not_started" })
    .returning();
  if (!ideaStage) throw new Error("failed to create idea stage");

  await startStage(ideaStage.id);
  return newProject;
}

/** Runs every role assigned to a stage and leaves it awaiting_approval. */
export async function startStage(stageId: string) {
  const [stageRow] = await db.select().from(stage).where(eq(stage.id, stageId)).limit(1);
  if (!stageRow) throw new Error(`stage ${stageId} not found`);

  const [projectRow] = await db.select().from(project).where(eq(project.id, stageRow.projectId)).limit(1);
  if (!projectRow) throw new Error(`project ${stageRow.projectId} not found`);

  await db
    .update(stage)
    .set({ status: "in_progress", startedAt: new Date() })
    .where(eq(stage.id, stageId));
  await db
    .update(project)
    .set({ currentStage: stageRow.type, updatedAt: new Date() })
    .where(eq(project.id, projectRow.id));

  const roles = STAGE_ROLES[stageRow.type];
  await Promise.all(roles.map((role) => runRoleSession(stageRow.id, projectRow, role)));

  await db
    .update(stage)
    .set({ status: "awaiting_approval", completedAt: new Date() })
    .where(eq(stage.id, stageId));

  return stageId;
}

async function runRoleSession(
  stageId: string,
  projectRow: typeof project.$inferSelect,
  role: AgentRole,
  feedback?: string,
) {
  const roleAgent = await getAgentByRole(role);
  if (!roleAgent) throw new Error(`no agent seeded for role ${role}`);

  const [sessionRow] = await db
    .insert(session)
    .values({ stageId, agentId: roleAgent.id, status: "running", startedAt: new Date() })
    .returning();
  if (!sessionRow) throw new Error("failed to create session");

  const [stageRow] = await db.select().from(stage).where(eq(stage.id, stageId)).limit(1);
  if (!stageRow) throw new Error(`stage ${stageId} not found`);

  const result = await runSession({
    role,
    stageType: stageRow.type,
    oneLineIdea: projectRow.oneLineIdea,
    feedback,
  });

  await db.insert(deliverable).values({
    stageId,
    sessionId: sessionRow.id,
    renderType: result.deliverable.renderType,
    content: result.deliverable.content as object,
    version: 1,
  });

  await db
    .update(session)
    .set({ status: "completed", endedAt: new Date(), tokenUsage: result.tokenUsage })
    .where(eq(session.id, sessionRow.id));

  return sessionRow;
}

/**
 * The one gate with a real side effect in v1: approving Build merges to
 * main (Phase 4). Every other stage's approval just unlocks the next one,
 * or marks the project Shipped on Docs.
 */
export async function approveStage(stageId: string, deliverableId: string) {
  const [stageRow] = await db.select().from(stage).where(eq(stage.id, stageId)).limit(1);
  if (!stageRow) throw new Error(`stage ${stageId} not found`);
  if (stageRow.status !== "awaiting_approval") {
    throw new GateError(
      `stage ${stageId} is '${stageRow.status}', not 'awaiting_approval' — nothing to approve`,
    );
  }

  await db
    .update(stage)
    .set({ status: "approved", approvedAt: new Date(), approvedDeliverableId: deliverableId })
    .where(eq(stage.id, stageId));

  if (stageRow.type === "build") {
    // Real worktree merge-to-main lands in Phase 4; mock mode just marks approved.
    console.log(`[state-machine] Build approved for project ${stageRow.projectId} — merge-to-main is a Phase 4 capability, not yet implemented`);
  }

  const [projectRow] = await db.select().from(project).where(eq(project.id, stageRow.projectId)).limit(1);
  if (!projectRow) throw new Error(`project ${stageRow.projectId} not found`);

  const next = nextStageType(stageRow.type);
  if (next === "shipped") {
    await db
      .update(project)
      .set({ status: "active", currentStage: "shipped", updatedAt: new Date() })
      .where(eq(project.id, projectRow.id));
    return { shipped: true };
  }

  const [nextStageRow] = await db
    .insert(stage)
    .values({ projectId: projectRow.id, type: next, cycle: 0, status: "not_started" })
    .returning();
  if (!nextStageRow) throw new Error("failed to create next stage");

  await startStage(nextStageRow.id);
  return { shipped: false, nextStageId: nextStageRow.id };
}

/** Writes rejection feedback to chat, re-queues the same agent(s), same stage. */
export async function rejectStage(stageId: string, feedback: string) {
  const [stageRow] = await db.select().from(stage).where(eq(stage.id, stageId)).limit(1);
  if (!stageRow) throw new Error(`stage ${stageId} not found`);
  if (stageRow.status !== "awaiting_approval") {
    throw new GateError(
      `stage ${stageId} is '${stageRow.status}', not 'awaiting_approval' — nothing to reject`,
    );
  }

  const [projectRow] = await db.select().from(project).where(eq(project.id, stageRow.projectId)).limit(1);
  if (!projectRow) throw new Error(`project ${stageRow.projectId} not found`);

  const roles = STAGE_ROLES[stageRow.type];
  for (const role of roles) {
    const roleAgent = await getAgentByRole(role);
    if (!roleAgent) continue;
    await db.insert(chatMessage).values({
      projectId: projectRow.id,
      agentId: roleAgent.id,
      role: "user",
      content: feedback,
      isRejectionFeedback: true,
    });
  }

  await db.update(stage).set({ status: "needs_revision" }).where(eq(stage.id, stageId));

  await Promise.all(roles.map((role) => runRoleSession(stageId, projectRow, role, feedback)));

  await db
    .update(stage)
    .set({ status: "awaiting_approval", completedAt: new Date() })
    .where(eq(stage.id, stageId));

  return stageId;
}

export async function getProjectStages(projectId: string) {
  return db
    .select()
    .from(stage)
    .where(eq(stage.projectId, projectId))
    .orderBy(desc(stage.startedAt));
}

export async function getStageDeliverables(stageId: string) {
  return db.select().from(deliverable).where(eq(deliverable.stageId, stageId));
}
