const WIDTH = 640;
const HEIGHT = 120;
const PAD_X = 24;
const PAD_TOP = 14;
const PAD_BOTTOM = 34;

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
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} className="overflow-visible">
      <defs>
        <linearGradient id="pipeline-flow-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--viz-1)" />
          <stop offset="35%" stopColor="var(--viz-2)" />
          <stop offset="70%" stopColor="var(--viz-3)" />
          <stop offset="100%" stopColor="var(--viz-4)" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#pipeline-flow-fill)" opacity="0.14" />
      <path d={linePath} fill="none" stroke="url(#pipeline-flow-fill)" strokeWidth="2" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={labels[i] ?? i}>
          <circle cx={p.x} cy={p.y} r={4} fill="var(--color-bg, #121110)" stroke="url(#pipeline-flow-fill)" strokeWidth="2" />
          <text
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            className="stat-number"
            style={{ fontSize: 11, fill: "var(--color-ink)", fontVariantNumeric: "tabular-nums" }}
          >
            {p.count}
          </text>
          <text
            x={p.x}
            y={HEIGHT - PAD_BOTTOM + 18}
            textAnchor="middle"
            style={{
              fontSize: 9,
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
  );
}
