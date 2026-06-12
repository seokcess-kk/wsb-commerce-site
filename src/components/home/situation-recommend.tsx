import Link from "next/link";
import { SITUATIONS } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";

// 상황별 추천 — 상황을 고르면 어울리는 제품으로 바로 이동.
export function SituationRecommend() {
  return (
    <section id="situation" className="scroll-mt-16 bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="FIND YOURS"
          title={
            <>
              지금, 당신의 <span className="text-ng-cobalt">상황은</span>?
            </>
          }
          description="상황을 고르면 어울리는 제품으로 바로 안내합니다."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SITUATIONS.map((s) => (
            <Link
              key={s.label}
              href={`/products/${s.slug}`}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-ng-offwhite p-5 transition-colors hover:border-ng-cobalt hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
            >
              <div>
                <p className="text-[11px] font-semibold text-stone-400">{s.persona}</p>
                <p className="mt-1 font-bold leading-snug text-ng-charcoal">{s.label}</p>
              </div>
              <span className="shrink-0 font-mono text-xs font-bold text-ng-cobalt transition-transform group-hover:translate-x-0.5">
                {s.code} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
