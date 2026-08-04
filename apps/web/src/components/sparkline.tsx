/** Plain inline-SVG sparkline — no charting library needed for a single line. */
export function Sparkline({ points, height = 48 }: { points: number[]; height?: number }) {
  const max = Math.max(1, ...points);
  const width = 100;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const linePath = `M${coords.join(" L")}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="overflow-visible">
      <path d={areaPath} fill="var(--color-accent)" opacity="0.12" />
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
