export const STAGE_TYPES = [
  "idea",
  "spec",
  "architecture",
  "build",
  "test",
  "docs",
] as const;
export type StageType = (typeof STAGE_TYPES)[number];

export const PROJECT_STAGES = [...STAGE_TYPES, "shipped"] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STATUSES = ["active", "paused", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STAGE_STATUSES = [
  "not_started",
  "in_progress",
  "awaiting_approval",
  "approved",
  "rejected",
  "needs_revision",
] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const AGENT_ROLES = [
  "orchestrator",
  "product",
  "architect",
  "backend",
  "frontend",
  "qa",
  "docs",
  "researcher",
  "designer",
  "devops",
  "security",
  "growth",
  "support",
] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];

export const SESSION_STATUSES = [
  "queued",
  "running",
  "waiting_on_user",
  "completed",
  "failed",
  "stopped",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const DELIVERABLE_RENDER_TYPES = ["markdown", "diff", "table", "file_list"] as const;
export type DeliverableRenderType = (typeof DELIVERABLE_RENDER_TYPES)[number];

export const CHAT_ROLES = ["user", "agent"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];
