import { AgentSprite } from "@/components/agent-sprite";
import type { AgentRole } from "@mission-control/shared";

interface RoomOccupant {
  id: string;
  role: AgentRole;
  name: string;
}

export function OfficeRoom({
  label,
  active,
  occupants,
}: {
  label: string;
  active: boolean;
  occupants: RoomOccupant[];
}) {
  return (
    <div
      className="flex min-h-[140px] flex-col gap-3 rounded-xl border p-4"
      style={{
        borderColor: active ? "var(--color-accent)" : "var(--color-border)",
        background: active
          ? "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))"
          : "var(--color-surface)",
      }}
    >
      <p
        className="font-mono text-[0.68rem] uppercase tracking-widest"
        style={{ color: active ? "var(--color-accent)" : "var(--color-ink-muted)" }}
      >
        {label}
      </p>
      <div className="flex flex-1 flex-wrap items-start gap-3">
        {occupants.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
            —
          </p>
        ) : (
          occupants.map((o) => (
            <div key={o.id} className="flex flex-col items-center gap-1">
              <AgentSprite role={o.role} size={48} />
              <span className="max-w-[64px] truncate text-center text-[0.68rem]" style={{ color: "var(--color-ink)" }}>
                {o.name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
