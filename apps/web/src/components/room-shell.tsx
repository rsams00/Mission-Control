import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * One illustrated top-down room panel for the Office view (Phase 3.1/2.3).
 * Not literal floor-plan art (no licensed/commissioned top-down tileset
 * exists for this project) — a floor tile grid and wall border built from
 * CSS. Occupants now carry their own desk/couch visual (OfficeAgentCard,
 * Option A), so this shell only provides the room chrome, not furniture.
 */
export function RoomShell({
  label,
  Icon,
  active,
  children,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border-2 p-0 transition-colors"
      style={{
        borderColor: active ? "var(--color-accent)" : "var(--color-border)",
        boxShadow: active
          ? "0 0 0 1px color-mix(in srgb, var(--color-accent) 40%, transparent), 0 16px 32px -20px color-mix(in srgb, var(--color-accent) 60%, transparent)"
          : "0 10px 24px -18px rgba(0,0,0,0.7)",
      }}
    >
      {/* floor */}
      <div
        className="absolute inset-0"
        style={{
          background: active
            ? "color-mix(in srgb, var(--color-accent) 7%, var(--color-surface))"
            : "var(--color-surface)",
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--color-ink) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-ink) 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative flex items-center gap-1.5 px-4 pt-4">
        <Icon className="h-3.5 w-3.5" style={{ color: active ? "var(--color-accent)" : "var(--color-ink-muted)" }} strokeWidth={2} />
        <p
          className="font-mono text-[0.66rem] uppercase tracking-widest"
          style={{ color: active ? "var(--color-accent)" : "var(--color-ink-muted)" }}
        >
          {label}
        </p>
      </div>

      <div className="relative flex flex-1 flex-wrap items-start gap-3 p-4 pt-3">{children}</div>
    </div>
  );
}
