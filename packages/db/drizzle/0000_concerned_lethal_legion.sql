CREATE TYPE "public"."agent_role" AS ENUM('orchestrator', 'product', 'architect', 'backend', 'frontend', 'qa', 'docs', 'researcher', 'designer', 'devops', 'security', 'growth', 'support');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'agent');--> statement-breakpoint
CREATE TYPE "public"."deliverable_render_type" AS ENUM('markdown', 'diff', 'table', 'file_list');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('idea', 'spec', 'architecture', 'build', 'test', 'docs', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('queued', 'running', 'waiting_on_user', 'completed', 'failed', 'stopped');--> statement-breakpoint
CREATE TYPE "public"."stage_status" AS ENUM('not_started', 'in_progress', 'awaiting_approval', 'approved', 'rejected', 'needs_revision');--> statement-breakpoint
CREATE TYPE "public"."stage_type" AS ENUM('idea', 'spec', 'architecture', 'build', 'test', 'docs');--> statement-breakpoint
CREATE TABLE "agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "agent_role" NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text NOT NULL,
	"tool_scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"is_rejection_feedback" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliverable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"session_id" uuid,
	"render_type" "deliverable_render_type" NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"one_line_idea" text NOT NULL,
	"current_stage" "project_stage" DEFAULT 'idea' NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"repo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_agent" (
	"project_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_agent_project_id_agent_id_pk" PRIMARY KEY("project_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'queued' NOT NULL,
	"worktree_path" text,
	"worktree_branch" text,
	"token_usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"transcript_ref" text
);
--> statement-breakpoint
CREATE TABLE "stage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" "stage_type" NOT NULL,
	"cycle" integer DEFAULT 0 NOT NULL,
	"status" "stage_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_deliverable_id" uuid,
	CONSTRAINT "stage_project_type_cycle_unique" UNIQUE("project_id","type","cycle")
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_stage_id_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_agent" ADD CONSTRAINT "project_agent_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_agent" ADD CONSTRAINT "project_agent_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_stage_id_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage" ADD CONSTRAINT "stage_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;