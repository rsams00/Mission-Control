import { AGENT_IDENTITY } from "@/lib/agent-identity";
import { StatusDot, type Presence } from "@/components/status-dot";
import type { AgentRole } from "@mission-control/shared";

export interface OfficeCardData {
  id: string;
  role: AgentRole;
  name: string;
  spriteUrl: string | null;
  projectName: string | null;
  presence: Presence;
}

/**
 * Personalized per-agent "workstation" card (Option A, per user direction):
 * portrait + a small desk/couch bearing the agent's own role icon as a
 * themed prop (Docs -> book, Security -> shield, QA -> flask, etc. — the
 * same icon/color already assigned in agent-identity.ts, reused here
 * rather than commissioning new art) + name + status dot. Replaces the
 * generic flat desk-block rendering.
 */
export function OfficeAgentCard({
  data,
  onSelect,
  variant = "desk",
}: {
  data: OfficeCardData;
  onSelect: (data: OfficeCardData) => void;
  variant?: "desk" | "couch";
}) {
  const identity = AGENT_IDENTITY[data.role];

  return (
    <button
      onClick={() => onSelect(data)}
      className="group flex w-[104px] shrink-0 flex-col items-center gap-1.5 rounded-xl p-2 transition-transform hover:scale-105"
    >
      <div className="relative">
        <span
          className="absolute -right-0.5 -top-0.5 z-10 rounded-full p-[3px]"
          style={{ background: "var(--color-surface)" }}
        >
          <StatusDot presence={data.presence} pulse />
        </span>
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
        >
          {data.spriteUrl ? (
            <img
              src={data.spriteUrl}
              alt={identity.label}
              width={56}
              height={56}
              style={{ imageRendering: "pixelated", width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <identity.Icon style={{ width: 26, height: 26, color: `var(${identity.color})` }} strokeWidth={1.75} />
          )}
        </div>
      </div>

      {/* the "desk"/"couch" — role-prop icon in the role's own color, per
          the icon/color mapping already established in agent-identity.ts */}
      <div
        className="flex h-6 w-full items-center justify-center border"
        style={{
          borderColor: "var(--color-border)",
          background: `color-mix(in srgb, var(${identity.color}) 10%, var(--color-surface-raised))`,
          borderRadius: variant === "couch" ? 999 : 6,
        }}
      >
        <identity.Icon style={{ width: 13, height: 13, color: `var(${identity.color})` }} strokeWidth={2} />
      </div>

      <span className="max-w-full truncate text-center text-[0.7rem]" style={{ color: "var(--color-ink)" }}>
        {data.name}
      </span>
      {data.projectName && (
        <span className="max-w-full truncate text-center text-[0.6rem]" style={{ color: "var(--color-ink-muted)" }}>
          {data.projectName}
        </span>
      )}
    </button>
  );
}
