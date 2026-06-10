export function Donut({ percent, label }: { percent: number; label: string }) {
  const r = 46, c = 2 * Math.PI * r;
  const on = Math.max(0, Math.min(100, percent)) / 100 * c;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ad-line-2)" strokeWidth="16" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ad-accent-2)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${on} ${c - on}`} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fill="var(--ad-ink)" fontFamily="monospace" fontSize="22" fontWeight="800">{percent}%</text>
      <text x="60" y="74" textAnchor="middle" fill="var(--ad-mut-2)" fontFamily="monospace" fontSize="9">{label}</text>
    </svg>
  );
}
