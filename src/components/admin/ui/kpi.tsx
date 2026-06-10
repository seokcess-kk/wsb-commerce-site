export function Kpi({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "pos" | "neg";
}) {
  return (
    <div className="rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-panel)] p-[18px]">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--ad-mut-2)]">{label}</p>
      <p className="mt-2.5 font-mono text-[28px] font-extrabold leading-none tracking-[-0.02em] text-[var(--ad-ink)]">{value}</p>
      {delta && (
        <p
          className="mt-2 font-mono text-[11px] font-semibold"
          style={{ color: deltaTone === "neg" ? "var(--ad-neg)" : "var(--ad-pos)" }}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
