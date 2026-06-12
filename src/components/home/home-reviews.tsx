import { REVIEWS, REVIEW_DISCLAIMER } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";

// 베타 테스터 후기 — 사용 경험·맛·편의 중심(효능 단정 없음) + 개인 경험 면책.
export function HomeReviews() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="BETA TESTERS"
          title={
            <>
              먼저 경험한 사람들의 <span className="text-ng-cobalt">이야기</span>
            </>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.author} className="flex h-full flex-col rounded-2xl border border-stone-200 bg-ng-offwhite p-6">
              <blockquote className="flex-1 text-sm leading-relaxed text-ng-charcoal">&ldquo;{r.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 text-xs font-semibold text-stone-500">
                {r.author} · {r.role}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-xs text-stone-400">{REVIEW_DISCLAIMER}</p>
      </div>
    </section>
  );
}
