import Link from "next/link";
import { PROJECT_STAGES } from "@mission-control/shared";
import {
  getPortfolioStats,
  getNeedsAttention,
  getPortfolioActivity,
  getPipelineDistribution,
} from "@/lib/data";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageStatusBadge } from "@/components/stage-badge";
import { FolderKanban, AlertCircle, CheckCircle2, Users, DollarSign, Plus, ArrowRight } from "lucide-react";

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
  const [stats, needsAttention, activity, distribution] = await Promise.all([
    getPortfolioStats(),
    getNeedsAttention(),
    getPortfolioActivity(),
    getPipelineDistribution(),
  ]);

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
            <CardDescription>Every stage currently waiting on an approval, across every project.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {needsAttention.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing waiting on you right now.</p>
            ) : (
              needsAttention.map(({ stage, project }) => (
                <Link
                  key={stage.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-raised"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-ink">{project.name}</span>
                    <span className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                      {STAGE_LABEL[stage.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StageStatusBadge status={stage.status} />
                    <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline shape</CardTitle>
            <CardDescription>How many projects are in each stage.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {PROJECT_STAGES.map((s) => {
              const count = distribution.get(s) ?? 0;
              const max = Math.max(1, ...Array.from(distribution.values()));
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-xs uppercase tracking-wide text-ink-muted">
                    {STAGE_LABEL[s]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="stat-number w-4 text-right text-xs text-ink-muted">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
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
