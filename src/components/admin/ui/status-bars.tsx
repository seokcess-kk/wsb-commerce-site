export function StatusBars({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2.5 border-b border-[var(--ad-line-2)] py-[7px] last:border-0">
          <span className="size-2 rounded-sm" style={{ background: r.color }} />
          <span className="text-[12.5px] text-[var(--ad-ink)]">{r.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded bg-[var(--ad-line-2)]">
            <span className="block h-full rounded" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className="w-6 text-right font-mono text-[13px] font-bold text-[var(--ad-ink)]">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
