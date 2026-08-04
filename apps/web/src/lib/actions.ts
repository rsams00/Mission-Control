"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, chatMessage } from "@mission-control/db";
import {
  createProject,
  approveStage,
  rejectStage,
  mockChatReplyFor,
  MergeConflictError,
} from "@mission-control/orchestrator";
import { getAgent, getChatMessages, getAgentActivity } from "./data";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const oneLineIdea = String(formData.get("oneLineIdea") ?? "").trim();
  if (!name || !oneLineIdea) {
    throw new Error("name and oneLineIdea are required");
  }

  const created = await createProject({ name, oneLineIdea });
  revalidatePath("/projects");
  redirect(`/projects/${created.id}`);
}

export async function approveStageAction(projectId: string, stageId: string, deliverableId: string) {
  try {
    await approveStage(stageId, deliverableId);
  } catch (err) {
    // Build's merge conflict is an expected domain outcome, not a crash —
    // surface it to the UI instead of throwing through the action boundary.
    // The stage itself is untouched (still awaiting_approval): approveStage
    // only mutates state after every branch merges cleanly.
    if (err instanceof MergeConflictError) {
      return {
        ok: false as const,
        error: `Merge conflict on branch '${err.branch}' — not auto-resolved. Reject this stage with feedback to re-run Build, or resolve manually in the project's repo.`,
      };
    }
    throw err;
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/"); // home page's approval inbox shows this same stage
  return { ok: true as const };
}

export async function rejectStageAction(projectId: string, stageId: string, feedback: string) {
  await rejectStage(stageId, feedback);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function sendChatMessageAction(projectId: string, agentId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return;

  await db.insert(chatMessage).values({
    projectId,
    agentId,
    role: "user",
    content: trimmed,
  });

  // Mock reply — real per-agent conversational sessions are a later phase;
  // this keeps the chat thread interactive at $0 in the meantime.
  const roleAgent = await getAgent(agentId);
  if (roleAgent) {
    await db.insert(chatMessage).values({
      projectId,
      agentId,
      role: "agent",
      content: mockChatReplyFor(roleAgent.role, trimmed),
    });
  }

  revalidatePath(`/projects/${projectId}/chat/${agentId}`);
}

/** Lets the floating chat widget (a Client Component) pull a thread on
 * demand when an agent is selected, without a full page navigation. */
export async function getChatMessagesAction(projectId: string, agentId: string) {
  return getChatMessages(projectId, agentId);
}

/** Lets the Office view's profile panel (a Client Component) pull one
 * agent's traits + cross-project history on demand when clicked. */
export async function getAgentProfileAction(agentId: string) {
  const [agentRow, activity] = await Promise.all([getAgent(agentId), getAgentActivity(agentId)]);
  return { agent: agentRow, activity };
}
