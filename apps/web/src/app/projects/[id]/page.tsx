import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjectStages, getStageSessions, getStageDeliverables } from "@/lib/data";
import { StagePipeline } from "@/components/stage-pipeline";
import { StageStatusBadge, CurrentStageBadge } from "@/components/stage-badge";
import { DeliverableViewer } from "@/components/deliverable-viewer";
import { ApprovalControls } from "@/components/approval-controls";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { Users, MessageCircle, Gamepad2 } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const stages = await getProjectStages(id);
  const activeStage = stages.find((s) => s.status === "awaiting_approval" || s.status === "needs_revision");

  const activeSessions = activeStage ? await getStageSessions(activeStage.id) : [];
  const activeDeliverables = activeStage ? await getStageDeliverables(activeStage.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Project</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{project.oneLineIdea}</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrentStageBadge stage={project.currentStage} />
          <Link
            href={`/projects/${id}/office`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            Office
          </Link>
          <Link
            href={`/projects/${id}/roster`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <Users className="h-3.5 w-3.5" />
            Roster
          </Link>
        </div>
      </div>

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
  );
}
