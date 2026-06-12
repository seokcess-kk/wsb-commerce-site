import type { ReactNode } from "react";

// 섹션 제목 — 모노 eyebrow + 한글 헤드라인 + 설명. 코발트/밝은 배경 두 톤 지원.
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "cobalt";
  className?: string;
}) {
  const onCobalt = tone === "cobalt";
  const wrap = [align === "center" ? "mx-auto max-w-2xl text-center" : "", className].filter(Boolean).join(" ");
  return (
    <div className={wrap}>
      {eyebrow && (
        <p className={`font-mono text-xs font-medium uppercase tracking-[0.25em] ${onCobalt ? "text-ng-neon" : "text-ng-cobalt"}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-[2rem] ${onCobalt ? "text-white" : "text-ng-charcoal"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base leading-relaxed ${onCobalt ? "text-white/75" : "text-stone-600"} ${align === "center" ? "" : "max-w-2xl"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
