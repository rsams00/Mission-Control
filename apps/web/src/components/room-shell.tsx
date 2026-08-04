import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * One illustrated top-down room panel for the Office view (Phase 3.1).
 * Not literal floor-plan art (no licensed/commissioned top-down tileset
 * exists for this project) — a floor tile grid, wall border, and a row of
 * desk blocks built from CSS, styled to read as a game-room space rather
 * than a flat status card. Agent markers render on top via `children`.
 */
export function RoomShell({
  label,
  Icon,
  active,
  deskCount = 3,
  variant = "desks",
  children,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  deskCount?: number;
  variant?: "desks" | "lounge";
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-[190px] flex-col overflow-hidden rounded-2xl border-2 p-0 transition-colors"
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

      {/* desks / furniture row */}
      <div className="relative flex gap-2 px-4 pt-4">
        {Array.from({ length: deskCount }).map((_, i) =>
          variant === "lounge" ? (
            <div
              key={i}
              className="h-6 flex-1 rounded-full border"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
            />
          ) : (
            <div
              key={i}
              className="h-7 flex-1 rounded-md border"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
            />
          ),
        )}
      </div>

      <div className="relative flex items-center gap-1.5 px-4 pt-3">
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
