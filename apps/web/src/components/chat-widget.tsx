"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { getProjectRoster } from "@/lib/data";
import { getChatMessagesAction, sendChatMessageAction } from "@/lib/actions";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MessageCircle, X, ArrowLeft, Send } from "lucide-react";
import type { AgentRole } from "@mission-control/shared";

type Roster = Awaited<ReturnType<typeof getProjectRoster>>;
type ChatMessageLike = Awaited<ReturnType<typeof getChatMessagesAction>>[number];

/**
 * Project-scoped floating chat widget — mounted only in
 * projects/[id]/layout.tsx, so it never appears on the home page or the
 * projects list. Picker -> thread, same data as the dedicated
 * /chat/[agentId] page (kept alive for direct links).
 */
export function ChatWidget({ projectId, roster }: { projectId: string; roster: Roster }) {
  const [open, setOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageLike[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const core = roster.filter((r) => r.projectAgent.active);
  const selected = core.find((r) => r.agent.id === selectedAgentId)?.agent;

  useEffect(() => {
    if (!selectedAgentId) return;
    setLoading(true);
    getChatMessagesAction(projectId, selectedAgentId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [projectId, selectedAgentId]);

  function send() {
    const content = draft.trim();
    if (!content || !selectedAgentId) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        projectId,
        agentId: selectedAgentId,
        role: "user",
        content,
        isRejectionFeedback: false,
        createdAt: new Date(),
      },
    ]);
    setDraft("");

    startTransition(async () => {
      await sendChatMessageAction(projectId, selectedAgentId, content);
      const fresh = await getChatMessagesAction(projectId, selectedAgentId);
      setMessages(fresh);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:w-96">
          {!selected ? (
            <>
              <div className="border-b border-border p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-widest text-ink-muted">Chat</p>
                <p className="mt-0.5 text-sm text-ink">Who do you want to talk to?</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-2">
                  {core.map(({ agent }) => {
                    const identity = AGENT_IDENTITY[agent.role as AgentRole];
                    return (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-colors hover:bg-surface-raised"
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: `color-mix(in srgb, var(${identity.color}) 20%, transparent)` }}
                        >
                          <identity.Icon className="h-5 w-5" style={{ color: `var(${identity.color})` }} strokeWidth={1.75} />
                        </span>
                        <span className="w-full truncate text-xs text-ink">{agent.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border p-3">
                <button
                  onClick={() => setSelectedAgentId(null)}
                  className="rounded-full p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink"
                  aria-label="Back to agent list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-ink">{selected.name}</span>
                <span className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-muted">
                  {AGENT_IDENTITY[selected.role as AgentRole].label}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {loading ? (
                  <p className="text-xs text-ink-muted">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-ink-muted">No messages yet — say hello.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3 py-1.5 text-xs",
                          m.role === "user" ? "bg-accent/15 text-ink" : "border border-border bg-surface-raised text-ink",
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2 border-t border-border p-3"
              >
                <Textarea
                  value={draft}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Message…"
                  rows={1}
                  className="min-h-0 flex-1 resize-none py-2"
                />
                <button
                  type="submit"
                  disabled={isPending || draft.trim().length === 0}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
