const WIDTH = 900;
const HEIGHT = 200;
const PAD_X = 36;
const PAD_TOP = 36;
const PAD_BOTTOM = 46;

/**
 * "Flow"-styled visualization of the pipeline shape (2.3 visual pass),
 * replacing the flat stage-count bar list. This intentionally isn't a
 * literal Sankey diagram — our data is a snapshot of each project's
 * *current* stage, not a historical flow-through count, so a converging
 * funnel would overstate what the numbers mean. Instead: a smooth area
 * curve across stages (current occupancy, honestly represented) rendered
 * with the flow-diagram *language* — gradient fill, glowing stage nodes,
 * smooth curves — that the reference borrowed this idea from.
 */
export function PipelineFlow({ counts, labels }: { counts: number[]; labels: string[] }) {
  const max = Math.max(1, ...counts);
  const n = counts.length;
  const step = n > 1 ? (WIDTH - PAD_X * 2) / (n - 1) : 0;
  const points = counts.map((c, i) => {
    const x = PAD_X + i * step;
    const y = PAD_TOP + (1 - c / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
    return { x, y, count: c };
  });
  const first = points[0];
  const last = points[points.length - 1];

  // Smooth curve through the points via cubic beziers, control points at
  // the horizontal midpoint of each segment — a simple, stable way to
  // avoid overshoot without a spline library.
  let linePath = first ? `M ${first.x} ${first.y}` : "";
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;
    const midX = (prev.x + curr.x) / 2;
    linePath += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaPath =
    first && last ? `${linePath} L ${last.x} ${HEIGHT - PAD_BOTTOM} L ${first.x} ${HEIGHT - PAD_BOTTOM} Z` : "";

  return (
    // A fixed pixel `height` alongside width="100%" doesn't scale with a
    // wider container (SVG's default preserveAspectRatio keeps it at its
    // native size instead of stretching) — that's what made this chart
    // stay small even in a wider card. An aspect-ratio wrapper with the
    // SVG at width/height 100% scales both dimensions together instead.
    <div style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, width: "100%" }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pipeline-flow-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--viz-1)" />
            <stop offset="35%" stopColor="var(--viz-2)" />
            <stop offset="70%" stopColor="var(--viz-3)" />
            <stop offset="100%" stopColor="var(--viz-4)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#pipeline-flow-fill)" opacity="0.14" />
        <path d={linePath} fill="none" stroke="url(#pipeline-flow-fill)" strokeWidth="3" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={labels[i] ?? i}>
            <circle cx={p.x} cy={p.y} r={6} fill="var(--color-surface)" stroke="url(#pipeline-flow-fill)" strokeWidth="3" />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              className="stat-number"
              style={{ fontSize: 20, fill: "var(--color-ink)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
            >
              {p.count}
            </text>
            <text
              x={p.x}
              y={HEIGHT - PAD_BOTTOM + 26}
              textAnchor="middle"
              style={{
                fontSize: 14,
                fill: "var(--color-ink-muted)",
                fontFamily: "ui-monospace, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {labels[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
