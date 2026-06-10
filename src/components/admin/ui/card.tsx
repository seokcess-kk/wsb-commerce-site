export function AdminCard({
  title,
  tag,
  children,
  className = "",
}: {
  title?: string;
  tag?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-panel)] p-[18px] " + className}>
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[13px] font-extrabold text-[var(--ad-ink)]">{title}</h2>
          {tag && <span className="ml-auto font-mono text-[10px] text-[var(--ad-mut-2)]">{tag}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
