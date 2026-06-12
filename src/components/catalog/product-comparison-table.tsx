import { PRODUCTS } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";
import { CTAButton } from "@/components/ui/cta-button";
import { Badge } from "@/components/ui/badge";

// NUTROGIN 3종 비교 — 추천상황·섭취타이밍·핵심키워드·가격·구매. 데스크톱 표 / 모바일 카드.
export function ProductComparisonTable({ priceBySlug = {} }: { priceBySlug?: Record<string, string> }) {
  const Keyword = ({ k }: { k: string }) => <Badge tone="neon">{k}</Badge>;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading
        eyebrow="COMPARE"
        title={
          <>
            3종, 무엇이 <span className="text-ng-cobalt">다를까요</span>?
          </>
        }
        description="집중이 필요한 아침부터 하루를 정리하는 밤까지. 상황에 맞는 한 스틱을 고르세요."
      />

      {/* 데스크톱 표 */}
      <div className="mt-8 hidden overflow-hidden rounded-2xl border border-stone-200 md:block">
        <table className="w-full text-sm [&_td]:px-5 [&_td]:py-4 [&_th]:px-5 [&_th]:py-3 [&_th]:text-left">
          <thead className="bg-ng-offwhite text-xs font-semibold text-stone-500">
            <tr>
              <th>제품</th>
              <th>추천 상황</th>
              <th>섭취 타이밍</th>
              <th>핵심 키워드</th>
              <th>가격</th>
              <th className="text-right">구매</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {PRODUCTS.map((p) => (
              <tr key={p.slug}>
                <td>
                  <span className="font-mono text-sm font-bold text-ng-cobalt">{p.code}</span>
                  <span className="ml-2 text-stone-500">{p.ko}</span>
                </td>
                <td className="text-stone-600">{p.situation}</td>
                <td className="text-stone-600">{p.timing}</td>
                <td>
                  <Keyword k={p.keyword} />
                </td>
                <td className="font-mono font-bold text-ng-charcoal">{priceBySlug[p.slug] ?? ""}</td>
                <td className="text-right">
                  <CTAButton href={`/products/${p.slug}`} variant="primary" size="sm">
                    구매
                  </CTAButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="mt-8 grid gap-3 md:hidden">
        {PRODUCTS.map((p) => (
          <div key={p.slug} className="rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-ng-cobalt">{p.code}</span>
                <span className="ml-2 text-sm text-stone-500">{p.ko}</span>
              </div>
              <Keyword k={p.keyword} />
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-stone-400">추천 상황</dt>
                <dd className="text-stone-600">{p.situation}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-stone-400">섭취 타이밍</dt>
                <dd className="text-stone-600">{p.timing}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono font-bold text-ng-charcoal">{priceBySlug[p.slug] ?? ""}</span>
              <CTAButton href={`/products/${p.slug}`} variant="primary" size="sm">
                구매하기
              </CTAButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
