interface DonutProps {
  percent: number;
  size?: number;
}

/** Progress ring drawn with theme tokens (accent arc over a muted track). */
export function Donut({ percent, size = 40 }: DonutProps) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${percent}% completed`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border-emphasized)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * percent) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
