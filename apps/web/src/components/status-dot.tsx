export type Presence = "active" | "waiting" | "idle";

const PRESENCE_COLOR: Record<Presence, string> = {
  active: "var(--color-success)",
  waiting: "var(--color-warning)",
  idle: "var(--color-ink-muted)",
};

const PRESENCE_LABEL: Record<Presence, string> = {
  active: "Session running",
  waiting: "Awaiting your approval",
  idle: "Idle",
};

/**
 * Shared tri-state status indicator — used on Office room cards and the
 * agent profile panel so an agent's presence reads the same everywhere.
 * Idle intentionally uses a neutral/muted color, not red — red is reserved
 * for --color-critical (real errors) elsewhere in the app.
 */
export function StatusDot({ presence, pulse = false }: { presence: Presence; pulse?: boolean }) {
  const color = PRESENCE_COLOR[presence];
  return (
    <span
      title={PRESENCE_LABEL[presence]}
      aria-label={PRESENCE_LABEL[presence]}
      className={pulse && presence === "active" ? "status-dot-pulse" : undefined}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: presence === "idle" ? "none" : `0 0 6px color-mix(in srgb, ${color} 70%, transparent)`,
      }}
    />
  );
}
