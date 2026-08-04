"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { sendChatMessageAction } from "@/lib/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface ChatMessageLike {
  id: string;
  role: "user" | "agent";
  content: string;
  isRejectionFeedback: boolean;
  createdAt: Date | string;
}

export function ChatPanel({
  projectId,
  agentId,
  initialMessages,
}: {
  projectId: string;
  agentId: string;
  initialMessages: ChatMessageLike[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // initialMessages gets a new reference every time the server component
  // re-renders (router.refresh() below) — sync local state so the mock
  // agent's reply actually shows up once it's persisted.
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  function send() {
    const content = draft.trim();
    if (!content) return;

    const optimistic: ChatMessageLike = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content,
      isRejectionFeedback: false,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    startTransition(async () => {
      await sendChatMessageAction(projectId, agentId, content);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No messages yet — this thread persists across the whole project, not just this stage.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}
            >
              {m.isRejectionFeedback && (
                <span className="font-mono text-[0.65rem] uppercase tracking-wide text-critical">
                  Rejection feedback
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-accent/15 text-ink"
                    : "border border-border bg-surface-raised text-ink",
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
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
          placeholder="Message this agent…"
          rows={2}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || draft.trim().length === 0}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
