"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { getAgentProfileAction } from "@/lib/actions";
import { AGENT_TRAIT_KEYS, type AgentRole } from "@mission-control/shared";
import { AgentMarkerVisual } from "@/components/agent-marker-visual";

type Profile = Awaited<ReturnType<typeof getAgentProfileAction>>;

const TRAIT_LABEL: Record<string, string> = {
  speed: "Speed",
  precision: "Precision",
  creativity: "Creativity",
  reliability: "Reliability",
  autonomy: "Autonomy",
};

/**
 * Slide-over panel opened by clicking an agent marker in the Office view:
 * RPG-style trait bars, current status, and a cross-project session
 * history — pulled on demand rather than passed down through every room,
 * same pattern as the chat widget's on-demand thread fetch.
 */
export function AgentProfilePanel({
  agentId,
  spriteUrl,
  onClose,
}: {
  agentId: string;
  spriteUrl: string | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setProfile(null);
    getAgentProfileAction(agentId).then(setProfile);
  }, [agentId]);

  const agent = profile?.agent;
  const identity = agent ? AGENT_IDENTITY[agent.role as AgentRole] : null;
  const traits = (agent?.traits ?? {}) as Record<string, number>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close profile"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        style={{ cursor: "default" }}
      />
      <div
        className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto border-l shadow-2xl"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--color-border)" }}>
          <p className="font-mono text-[0.68rem] uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
            Agent profile
          </p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:opacity-80"
            style={{ color: "var(--color-ink-muted)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!profile || !agent || !identity ? (
          <div className="p-4 text-sm" style={{ color: "var(--color-ink-muted)" }}>
            Loading…
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-5">
            <div className="flex items-center gap-3">
              <AgentMarkerVisual role={agent.role as AgentRole} spriteUrl={spriteUrl} size={56} />
              <div>
                <p className="text-lg font-semibold" style={{ color: "var(--color-ink)" }}>
                  {agent.name}
                </p>
                <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                  {identity.label}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-mono text-[0.66rem] uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
                Traits
              </p>
              <div className="flex flex-col gap-2">
                {AGENT_TRAIT_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs" style={{ color: "var(--color-ink)" }}>
                      {TRAIT_LABEL[key]}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-surface-raised)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${((traits[key] ?? 0) / 10) * 100}%`, background: "var(--color-accent)" }}
                      />
                    </div>
                    <span className="stat-number w-5 text-right text-xs" style={{ color: "var(--color-ink-muted)" }}>
                      {traits[key] ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-mono text-[0.66rem] uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
                Footprint
              </p>
              <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                {profile.activity.projectCount} project{profile.activity.projectCount === 1 ? "" : "s"} ·{" "}
                {profile.activity.sessions.length} session{profile.activity.sessions.length === 1 ? "" : "s"}
              </p>
            </div>

            <div>
              <p className="mb-2 font-mono text-[0.66rem] uppercase tracking-widest" style={{ color: "var(--color-ink-muted)" }}>
                Recent sessions
              </p>
              {profile.activity.sessions.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                  No sessions yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.activity.sessions.slice(0, 8).map((row) => (
                    <li key={row.session.id} className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                      <Link
                        href={`/projects/${row.project.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {row.project.name}
                      </Link>{" "}
                      — <span style={{ color: "var(--color-accent)" }}>{row.stage.type}</span> · {row.session.status}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href={`/projects/${profile.activity.sessions[0]?.project.id ?? ""}/chat/${agent.id}`}
              className="rounded-full px-4 py-2 text-center text-sm font-medium"
              style={{
                background: profile.activity.sessions[0] ? "var(--color-accent)" : "var(--color-surface-raised)",
                color: profile.activity.sessions[0] ? "var(--color-accent-ink)" : "var(--color-ink-muted)",
                pointerEvents: profile.activity.sessions[0] ? "auto" : "none",
              }}
            >
              Open chat
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
