const base =
  "rounded-lg border border-[var(--ad-line)] bg-[var(--ad-panel)] px-3 py-2 text-sm text-[var(--ad-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)]";

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}
export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} ${props.className ?? ""}`} />;
}
export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}
export function AdminCheckbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" {...props} className={`size-4 accent-[var(--ad-accent)] ${props.className ?? ""}`} />;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" };
export function AdminButton({ variant = "primary", className = "", ...rest }: BtnProps) {
  const v =
    variant === "primary"
      ? "bg-[var(--ad-accent)] text-white hover:opacity-90"
      : variant === "danger"
        ? "border border-[var(--ad-neg)] text-[var(--ad-neg)] hover:bg-[var(--ad-neg)]/5"
        : "border border-[var(--ad-line)] text-[var(--ad-mut)] hover:text-[var(--ad-ink)]";
  return (
    <button
      {...rest}
      className={`rounded-lg px-3.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] disabled:opacity-50 ${v} ${className}`}
    />
  );
}
