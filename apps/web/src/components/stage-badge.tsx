import { Badge } from "@/components/ui/badge";
import type { ProjectStage, StageStatus } from "@mission-control/shared";

const STAGE_LABEL: Record<ProjectStage, string> = {
  idea: "Idea",
  spec: "Spec",
  architecture: "Architecture",
  build: "Build",
  test: "Test",
  docs: "Docs",
  shipped: "Shipped",
};

export function CurrentStageBadge({ stage }: { stage: ProjectStage }) {
  const variant = stage === "shipped" ? "success" : "accent";
  return <Badge variant={variant}>{STAGE_LABEL[stage]}</Badge>;
}

const STATUS_VARIANT: Record<StageStatus, "default" | "accent" | "success" | "warning" | "critical"> = {
  not_started: "default",
  in_progress: "accent",
  awaiting_approval: "warning",
  approved: "success",
  rejected: "critical",
  needs_revision: "critical",
};

const STATUS_LABEL: Record<StageStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  needs_revision: "Needs revision",
};

export function StageStatusBadge({ status }: { status: StageStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
