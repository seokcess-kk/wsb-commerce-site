// 공유 baseline + y축 눈금 + 그리드 + 정렬된 x라벨의 막대차트. 의존성 0, 서버 렌더.
export function RevenueChart({ data }: { data: { day: string; total: number }[] }) {
  const W = 560, H = 220, P = { l: 40, r: 14, t: 14, b: 26 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const max = Math.max(1, ...data.map((d) => d.total));
  const ymax = Math.max(30000, Math.ceil(max / 30000) * 30000);
  const slot = iw / Math.max(1, data.length);
  const bw = slot * 0.62;
  const y = (v: number) => P.t + ih - (v / ymax) * ih;
  const ticks: number[] = [];
  for (let v = 0; v <= ymax; v += 30000) ticks.push(v);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--ad-mut-2)]">데이터 없음</p>;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="매출 추이">
      <defs>
        <linearGradient id="ad-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ad-accent-2)" />
          <stop offset="1" stopColor="var(--ad-accent)" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <line key={v} x1={P.l} y1={y(v)} x2={W - P.r} y2={y(v)} stroke="var(--ad-line-2)" />
      ))}
      {ticks.map((v) => (
        <text key={"t" + v} x={P.l - 6} y={y(v) + 3} textAnchor="end" fill="var(--ad-mut-2)" fontFamily="monospace" fontSize="9">
          {v / 1000}k
        </text>
      ))}
      {data.map((d, i) => {
        const bx = P.l + i * slot + (slot - bw) / 2;
        const by = y(d.total);
        return (
          <g key={d.day}>
            <rect x={bx} y={by} width={bw} height={P.t + ih - by} rx="3" fill="url(#ad-bar)" />
            <text x={bx + bw / 2} y={H - 10} textAnchor="middle" fill="var(--ad-mut)" fontFamily="monospace" fontSize="8.5">
              {d.day.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
