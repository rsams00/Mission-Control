import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjectRoster, getLatestSessionsByAgent } from "@/lib/data";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Gamepad2 } from "lucide-react";

export default async function RosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const roster = await getProjectRoster(id);
  const latestByAgent = await getLatestSessionsByAgent(id);

  const core = roster.filter((r) => r.projectAgent.active);
  const addAsNeeded = roster.filter((r) => !r.projectAgent.active);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {project.name}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Roster</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">Your AI team</h1>
          </div>
          <Link
            href={`/projects/${id}/office`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            Office
          </Link>
        </div>
      </div>

      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
          Core team — {core.length} active
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {core.map(({ agent }) => (
            <RosterCard key={agent.id} agent={agent} projectId={id} latest={latestByAgent.get(agent.id)} />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
          Add as needed — {addAsNeeded.length} inactive
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {addAsNeeded.map(({ agent }) => (
            <RosterCard
              key={agent.id}
              agent={agent}
              projectId={id}
              latest={latestByAgent.get(agent.id)}
              inactive
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function RosterCard({
  agent,
  projectId,
  latest,
  inactive,
}: {
  agent: { id: string; role: keyof typeof AGENT_IDENTITY; name: string };
  projectId: string;
  latest: { stage: { type: string }; session: { status: string } } | undefined;
  inactive?: boolean;
}) {
  const identity = AGENT_IDENTITY[agent.role];
  const snippet = latest
    ? `Last ran the ${latest.stage.type} stage — ${latest.session.status}`
    : inactive
      ? "Not activated on this project"
      : "Not yet activated";

  return (
    <Card className={inactive ? "opacity-60" : undefined}>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, var(${identity.color}) 18%, transparent)` }}
            >
              <identity.Icon className="h-4 w-4" style={{ color: `var(${identity.color})` }} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{agent.name}</p>
              <p className="font-mono text-[0.68rem] uppercase tracking-wide text-ink-muted">
                {identity.label}
              </p>
            </div>
          </div>
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: inactive ? "var(--color-border)" : "var(--color-success)" }}
          />
          <Link
            href={`/projects/${projectId}/chat/${agent.id}`}
            className="text-ink-muted hover:text-accent"
            aria-label={`Chat with ${agent.name}`}
          >
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-xs text-ink-muted">{snippet}</p>
      </CardContent>
    </Card>
  );
}
