import Link from "next/link";
import { PROJECT_STAGES } from "@mission-control/shared";
import {
  getPortfolioStats,
  getNeedsAttention,
  getPortfolioActivity,
  getPipelineDistribution,
  getStageDeliverables,
  getSessionActivitySparkline,
} from "@/lib/data";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageStatusBadge } from "@/components/stage-badge";
import { ApprovalControls } from "@/components/approval-controls";
import { Sparkline } from "@/components/sparkline";
import { PipelineFlow } from "@/components/pipeline-flow";
import { FolderKanban, AlertCircle, CheckCircle2, Users, DollarSign, Plus } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  idea: "Idea",
  spec: "Spec",
  architecture: "Architecture",
  build: "Build",
  test: "Test",
  docs: "Docs",
  shipped: "Shipped",
};

export default async function HomePage() {
  const [stats, needsAttention, activity, distribution, sparkline] = await Promise.all([
    getPortfolioStats(),
    getNeedsAttention(),
    getPortfolioActivity(),
    getPipelineDistribution(),
    getSessionActivitySparkline(),
  ]);

  // Approval inbox needs a deliverable id per stage to wire up inline
  // Approve/Reject — same "first deliverable" convention the project page
  // uses (Build's role deliverables aren't merged into one record; the
  // stage-level approval doesn't depend on which one is referenced).
  const inboxItems = await Promise.all(
    needsAttention.map(async ({ stage, project }) => {
      const deliverables = await getStageDeliverables(stage.id);
      return { stage, project, deliverableId: deliverables[0]?.id ?? null };
    }),
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Mission Control</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Your AI team, at a glance</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Every project, every gate awaiting you, every agent currently at work — one view.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Projects" value={String(stats.totalProjects)} icon={FolderKanban} />
        <StatTile
          label="Awaiting you"
          value={String(stats.awaitingApprovalCount)}
          icon={AlertCircle}
          accent={stats.awaitingApprovalCount > 0}
        />
        <StatTile label="Shipped" value={String(stats.shippedCount)} icon={CheckCircle2} />
        <StatTile label="Agents active" value={String(stats.activeAgentCount)} icon={Users} />
        <StatTile label="Spent (mock mode)" value={`$${stats.totalCostUsd.toFixed(2)}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Needs your attention</CardTitle>
            <CardDescription>
              Every stage currently waiting on an approval, across every project — approve or reject right here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {inboxItems.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing waiting on you right now.</p>
            ) : (
              inboxItems.map(({ stage, project, deliverableId }) => (
                <div key={stage.id} className="flex flex-col gap-3 rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-3 hover:text-accent">
                      <span className="font-medium text-ink">{project.name}</span>
                      <span className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                        {STAGE_LABEL[stage.type]}
                      </span>
                    </Link>
                    <StageStatusBadge status={stage.status} />
                  </div>
                  {deliverableId ? (
                    <ApprovalControls projectId={project.id} stageId={stage.id} deliverableId={deliverableId} />
                  ) : (
                    <p className="text-xs text-ink-muted">No deliverable yet — check the project page.</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session activity</CardTitle>
              <CardDescription>Sessions completed per day, last 14 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <Sparkline points={sparkline.map((d) => d.count)} />
              <div className="mt-2 flex items-center justify-between text-[0.68rem] text-ink-muted">
                <span>{sparkline[0]?.date.slice(5)}</span>
                <span className="stat-number text-ink">
                  {sparkline.reduce((sum, d) => sum + d.count, 0)} total
                </span>
                <span>{sparkline[sparkline.length - 1]?.date.slice(5)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline shape</CardTitle>
              <CardDescription>How many projects currently sit in each stage.</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineFlow
                counts={PROJECT_STAGES.map((s) => distribution.get(s) ?? 0)}
                labels={PROJECT_STAGES.map((s) => STAGE_LABEL[s] ?? s)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Across every project — most recent first.</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-ink-muted">No sessions have run yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 font-mono text-xs">
              {activity.map(({ session, stage, project, agent }) => (
                <li key={session.id} className="text-ink-muted">
                  <span className="text-ink">{agent.name}</span> ran the{" "}
                  <span className="text-accent">{stage.type}</span> stage on{" "}
                  <Link href={`/projects/${project.id}`} className="text-ink hover:text-accent">
                    {project.name}
                  </Link>{" "}
                  — {session.status}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
