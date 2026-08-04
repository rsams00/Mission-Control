import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getProject, getProjectRoster } from "@/lib/data";
import { ProjectTabs } from "@/components/project-tabs";
import { CurrentStageBadge } from "@/components/stage-badge";
import { ChatWidget } from "@/components/chat-widget";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, roster] = await Promise.all([getProject(id), getProjectRoster(id)]);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Project</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{project.oneLineIdea}</p>
        </div>
        <CurrentStageBadge stage={project.currentStage} />
      </div>

      <ProjectTabs projectId={id} />

      {children}

      <ChatWidget projectId={id} roster={roster} />
    </div>
  );
}
