import { STAGE_TYPES, type StageStatus, type StageType } from "@mission-control/shared";
import { cn } from "@/lib/utils";

interface StageRow {
  type: StageType;
  status: StageStatus;
}

const LABEL: Record<StageType, string> = {
  idea: "Idea",
  spec: "Spec",
  architecture: "Architecture",
  build: "Build",
  test: "Test",
  docs: "Docs",
};

function dotClass(status: StageStatus | "pending") {
  switch (status) {
    case "approved":
      return "bg-success";
    case "awaiting_approval":
      return "bg-warning";
    case "needs_revision":
    case "rejected":
      return "bg-critical";
    case "in_progress":
      return "bg-accent";
    default:
      return "bg-border";
  }
}

export function StagePipeline({ stages }: { stages: StageRow[] }) {
  const byType = new Map(stages.map((s) => [s.type, s.status]));

  return (
    <div className="flex flex-wrap items-center gap-0 rounded-xl border border-border bg-surface p-4">
      {STAGE_TYPES.map((type, i) => {
        const status = byType.get(type) ?? "pending";
        return (
          <div key={type} className="flex items-center">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
              <span className={cn("h-2 w-2 rounded-full", dotClass(status))} />
              <span className="font-mono text-xs text-ink">{LABEL[type]}</span>
            </div>
            {i < STAGE_TYPES.length - 1 && <span className="px-2 text-ink-muted">›</span>}
          </div>
        );
      })}
      <span className="px-2 text-ink-muted">›</span>
      <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2">
        <span className="font-mono text-xs text-accent">Shipped</span>
      </div>
    </div>
  );
}
