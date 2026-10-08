const DATA = [
  { label: 'Web Dev', target: 88, inProgress: 55, completed: 60 },
  { label: 'Cloud Ops', target: 70, inProgress: 33, completed: 45 },
  { label: 'Data & AI', target: 75, inProgress: 44, completed: 48 },
  { label: 'Cyber Security', target: 90, inProgress: 52, completed: 38 },
  { label: 'Business', target: 70, inProgress: 52, completed: 58 },
  { label: 'Design', target: 62, inProgress: 52, completed: 25 },
];

const W = 520;
const H = 190;
const LEFT = 30;
const BASE = H - 10;
const TOP = 6;

const y = (v: number) => BASE - ((BASE - TOP) * v) / 100;

/** Grouped bar chart (Target / In production / Completed) using theme colour tokens. */
export function BarChart() {
  const groupW = (W - LEFT) / DATA.length;
  const barW = 12;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" role="img" aria-label="Production progress per programme">
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={t}>
          <line x1={LEFT} x2={W} y1={y(t)} y2={y(t)} stroke="var(--color-border)" />
          <text x={LEFT - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--color-text-secondary)">
            {t}
          </text>
        </g>
      ))}
      {DATA.map((d, i) => {
        const x0 = LEFT + i * groupW + (groupW - barW * 3 - 4) / 2;
        const bars: [number, string][] = [
          [d.target, 'var(--color-border-emphasized)'],
          [d.inProgress, 'var(--color-accent)'],
          [d.completed, 'var(--color-text-accent)'],
        ];
        return (
          <g key={d.label}>
            {bars.map(([v, fill], j) => (
              <rect key={j} x={x0 + j * (barW + 2)} y={y(v)} width={barW} height={BASE - y(v)} rx={1.5} fill={fill} />
            ))}
            <text x={LEFT + i * groupW + groupW / 2} y={H + 10} textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const CHART_LEGEND = [
  { label: 'Target', color: 'var(--color-border-emphasized)' },
  { label: 'In production', color: 'var(--color-accent)' },
  { label: 'Completed', color: 'var(--color-text-accent)' },
];
