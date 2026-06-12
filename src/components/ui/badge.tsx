import type { ReactNode } from "react";

// 상태/혜택 배지 — BEST/NEW/추천/품절/재입고/루틴 등. 네온 강조가 기본.
type BadgeTone = "neon" | "cobalt" | "soldout" | "muted";

const TONES: Record<BadgeTone, string> = {
  neon: "bg-ng-neon text-ng-charcoal",
  cobalt: "bg-ng-cobalt text-white",
  soldout: "bg-stone-200 text-stone-500",
  muted: "border border-stone-300 text-stone-500",
};

export function Badge({
  children,
  tone = "neon",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
