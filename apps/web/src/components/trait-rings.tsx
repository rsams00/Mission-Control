import { AGENT_TRAIT_KEYS, type AgentTraitKey } from "@mission-control/shared";

const TRAIT_LABEL: Record<AgentTraitKey, string> = {
  speed: "Speed",
  precision: "Precision",
  creativity: "Creativity",
  reliability: "Reliability",
  autonomy: "Autonomy",
};

// One color per ring, walking the secondary data-viz gradient outward —
// innermost ring is the "hottest" (speed), outermost the "coolest" (autonomy).
const TRAIT_COLOR: Record<AgentTraitKey, string> = {
  speed: "var(--viz-1)",
  precision: "#ff5470",
  creativity: "var(--viz-2)",
  reliability: "var(--viz-3)",
  autonomy: "var(--viz-4)",
};

const SIZE = 168;
const CENTER = SIZE / 2;
const RADII: Record<AgentTraitKey, number> = {
  speed: 76,
  precision: 62,
  creativity: 48,
  reliability: 34,
  autonomy: 20,
};
const STROKE = 9;

/**
 * Concentric radial rings for an agent's 5 traits — replaces flat progress
 * bars with the gauge language from the telemetry-dashboard reference.
 * Pure inline SVG, no charting library needed for 5 arcs.
 */
export function TraitRings({ traits }: { traits: Record<string, number> }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        {AGENT_TRAIT_KEYS.map((key) => {
          const r = RADII[key];
          const circumference = 2 * Math.PI * r;
          const value = traits[key] ?? 0;
          const fraction = Math.max(0, Math.min(1, value / 10));
          const dash = fraction * circumference;
          return (
            <g key={key} transform={`rotate(-90 ${CENTER} ${CENTER})`}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="var(--color-surface-raised)"
                strokeWidth={STROKE}
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke={TRAIT_COLOR[key]}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                style={{ filter: `drop-shadow(0 0 3px color-mix(in srgb, ${TRAIT_COLOR[key]} 70%, transparent))` }}
              />
            </g>
          );
        })}
      </svg>

      <div className="grid w-full grid-cols-1 gap-1.5">
        {AGENT_TRAIT_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TRAIT_COLOR[key] }} />
            <span className="flex-1" style={{ color: "var(--color-ink)" }}>
              {TRAIT_LABEL[key]}
            </span>
            <span className="stat-number" style={{ color: "var(--color-ink-muted)" }}>
              {traits[key] ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
