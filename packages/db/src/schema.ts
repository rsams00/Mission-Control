import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import {
  PROJECT_STAGES,
  PROJECT_STATUSES,
  STAGE_TYPES,
  STAGE_STATUSES,
  AGENT_ROLES,
  SESSION_STATUSES,
  DELIVERABLE_RENDER_TYPES,
  CHAT_ROLES,
} from "@mission-control/shared";

export const projectStageEnum = pgEnum("project_stage", PROJECT_STAGES);
export const projectStatusEnum = pgEnum("project_status", PROJECT_STATUSES);
export const stageTypeEnum = pgEnum("stage_type", STAGE_TYPES);
export const stageStatusEnum = pgEnum("stage_status", STAGE_STATUSES);
export const agentRoleEnum = pgEnum("agent_role", AGENT_ROLES);
export const sessionStatusEnum = pgEnum("session_status", SESSION_STATUSES);
export const deliverableRenderTypeEnum = pgEnum(
  "deliverable_render_type",
  DELIVERABLE_RENDER_TYPES,
);
export const chatRoleEnum = pgEnum("chat_role", CHAT_ROLES);

// One product idea moving through the pipeline.
export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  oneLineIdea: text("one_line_idea").notNull(),
  currentStage: projectStageEnum("current_stage").notNull().default("idea"),
  status: projectStatusEnum("status").notNull().default("active"),
  // Set once Build auto-scaffolds this project's own git repo (Phase 3).
  repoPath: text("repo_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One pipeline step for a project, versioned by loop cycle (see deliverable
// FK below — declared after `deliverable` since the reference is circular).
export const stage = pgTable(
  "stage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    type: stageTypeEnum("type").notNull(),
    // Bumped each time the project loops back to this stage type (Shipped -> Spec).
    cycle: integer("cycle").notNull().default(0),
    status: stageStatusEnum("status").notNull().default("not_started"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    // References deliverable.id; no FK constraint declared here to avoid a
    // circular table dependency — enforced at the application layer.
    approvedDeliverableId: uuid("approved_deliverable_id"),
  },
  (table) => [unique("stage_project_type_cycle_unique").on(table.projectId, table.type, table.cycle)],
);

// Global roster config — not per-project. "Nova the Architect" is one
// persistent identity reused across every project.
export const agent = pgTable("agent", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: agentRoleEnum("role").notNull(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  toolScope: jsonb("tool_scope").notNull().default({}),
  model: text("model").notNull(),
  active: boolean("active").notNull().default(true),
});

// Which roles are enabled for a given project. Core team rows are inserted
// active=true on project creation; "add as needed" roles start inactive.
export const projectAgent = pgTable(
  "project_agent",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.agentId] })],
);

// One running (or completed) Agent SDK instance, tied to a stage and role.
export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  stageId: uuid("stage_id")
    .notNull()
    .references(() => stage.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agent.id, { onDelete: "restrict" }),
  status: sessionStatusEnum("status").notNull().default("queued"),
  worktreePath: text("worktree_path"),
  // Needed to merge this session's branch into main on Build approval (Phase 3).
  worktreeBranch: text("worktree_branch"),
  tokenUsage: jsonb("token_usage").notNull().default({}),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  // Pointer to the stored transcript, e.g. ./data/transcripts/<session_id>.jsonl
  transcriptRef: text("transcript_ref"),
});

// The actual output artifact a stage (or one agent within it) produces.
export const deliverable = pgTable("deliverable", {
  id: uuid("id").primaryKey().defaultRandom(),
  stageId: uuid("stage_id")
    .notNull()
    .references(() => stage.id, { onDelete: "cascade" }),
  // Set for one agent's own output (e.g. Backend's partial diff mid-Build);
  // null for the stage's merged/final output.
  sessionId: uuid("session_id").references(() => session.id, { onDelete: "set null" }),
  renderType: deliverableRenderTypeEnum("render_type").notNull(),
  content: jsonb("content").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Persistent per-agent conversation, independent of stage status — this is
// what lets the user talk to Architect weeks later with full context intact.
export const chatMessage = pgTable("chat_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agent.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  // Flags this message as the reason a deliverable was rejected, so the
  // re-queued agent's session — and the UI — can surface it distinctly.
  isRejectionFeedback: boolean("is_rejection_feedback").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
