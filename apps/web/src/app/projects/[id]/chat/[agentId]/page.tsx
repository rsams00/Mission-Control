import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getAgent, getChatMessages } from "@/lib/data";
import { ChatPanel } from "@/components/chat-panel";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { ArrowLeft } from "lucide-react";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string; agentId: string }>;
}) {
  const { id, agentId } = await params;
  const [project, agent] = await Promise.all([getProject(id), getAgent(agentId)]);
  if (!project || !agent) notFound();

  const messages = await getChatMessages(id, agentId);
  const identity = AGENT_IDENTITY[agent.role];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${id}/roster`}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Roster
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <identity.Icon className="h-5 w-5" style={{ color: `var(${identity.color})` }} strokeWidth={1.75} />
          <h2 className="text-xl font-semibold text-ink">{agent.name}</h2>
          <span className="font-mono text-xs uppercase tracking-wide text-ink-muted">{identity.label}</span>
        </div>
      </div>

      <ChatPanel projectId={id} agentId={agentId} initialMessages={messages} />
    </div>
  );
}
