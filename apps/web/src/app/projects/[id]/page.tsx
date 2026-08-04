import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProject,
  getProjectStages,
  getStageSessions,
  getStageDeliverables,
  getProjectRoster,
  getLatestSessionsByAgent,
} from "@/lib/data";
import { StagePipeline } from "@/components/stage-pipeline";
import { StageStatusBadge } from "@/components/stage-badge";
import { DeliverableViewer } from "@/components/deliverable-viewer";
import { ApprovalControls } from "@/components/approval-controls";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { MessageCircle } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const stages = await getProjectStages(id);
  const activeStage = stages.find((s) => s.status === "awaiting_approval" || s.status === "needs_revision");

  const [activeSessions, activeDeliverables, roster, latestByAgent] = await Promise.all([
    activeStage ? getStageSessions(activeStage.id) : Promise.resolve([]),
    activeStage ? getStageDeliverables(activeStage.id) : Promise.resolve([]),
    getProjectRoster(id),
    getLatestSessionsByAgent(id),
  ]);

  const coreTeam = roster.filter((r) => r.projectAgent.active);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-6">
        <StagePipeline stages={stages} />

        {project.currentStage === "shipped" ? (
          <Card>
            <CardHeader>
              <CardTitle>Shipped</CardTitle>
              <CardDescription>
                This project has completed the pipeline. New feature requests loop back to Spec (Phase 5).
              </CardDescription>
            </CardHeader>
          </Card>
        ) : activeStage ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{activeStage.type} — deliverables</CardTitle>
                <StageStatusBadge status={activeStage.status} />
              </div>
              <CardDescription>
                {activeSessions.length} session{activeSessions.length === 1 ? "" : "s"} ran this stage.
                Review below, then approve to advance or reject with feedback to re-queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {activeSessions.map(({ session, agent }) => {
                const identity = AGENT_IDENTITY[agent.role];
                const del = activeDeliverables.find((d) => d.sessionId === session.id);
                return (
                  <div key={session.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <identity.Icon
                          className="h-4 w-4"
                          style={{ color: `var(${identity.color})` }}
                          strokeWidth={1.75}
                        />
                        <span className="text-sm font-medium text-ink">{agent.name}</span>
                        <span className="font-mono text-xs text-ink-muted">{identity.label}</span>
                      </div>
                      <Link
                        href={`/projects/${id}/chat/${agent.id}`}
                        className="flex items-center gap-1 text-xs text-ink-muted hover:text-accent"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Chat
                      </Link>
                    </div>
                    {del ? (
                      <DeliverableViewer deliverable={del} />
                    ) : (
                      <p className="text-xs text-ink-muted">No deliverable recorded for this session.</p>
                    )}
                  </div>
                );
              })}

              {activeDeliverables[0] && (
                <ApprovalControls
                  projectId={id}
                  stageId={activeStage.id}
                  deliverableId={activeDeliverables[0].id}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Working…</CardTitle>
              <CardDescription>No stage is currently awaiting your approval.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <p className="font-mono text-[0.68rem] uppercase tracking-widest text-ink-muted">Roster</p>
        <Card className="p-2">
          <div className="flex flex-col">
            {coreTeam.map(({ agent }) => {
              const identity = AGENT_IDENTITY[agent.role];
              const latest = latestByAgent.get(agent.id);
              return (
                <Link
                  key={agent.id}
                  href={`/projects/${id}/chat/${agent.id}`}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-surface-raised"
                >
                  <identity.Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: `var(${identity.color})` }}
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{agent.name}</p>
                    <p className="truncate text-[0.68rem] text-ink-muted">
                      {latest ? `${latest.stage.type} — ${latest.session.status}` : "idle"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
        <Link
          href={`/projects/${id}/roster`}
          className="text-center text-xs text-ink-muted hover:text-accent"
        >
          View full roster →
        </Link>
      </aside>
    </div>
  );
}
