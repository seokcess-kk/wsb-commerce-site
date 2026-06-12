import { PRODUCTS } from "@/lib/brand/copy";
import { ProductVisual } from "@/components/catalog/product-visual";
import { SectionHeading } from "@/components/ui/section-heading";
import { CTAButton } from "@/components/ui/cta-button";

// NUTROGIN 3종 라인업 — 코발트 존. 홈·브랜드·PDP에서 공유.
// 카피는 brand/copy.ts(PRODUCTS) 단일 출처, 가격/이미지만 DB에서 주입.
export function NutroginLineup({
  priceBySlug = {},
  imageBySlug = {},
  eyebrow = "NUTROGIN LINEUP",
}: {
  priceBySlug?: Record<string, string>;
  imageBySlug?: Record<string, string | null>;
  eyebrow?: string;
}) {
  return (
    <section className="border-t-2 border-ng-neon bg-ng-cobalt px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          tone="cobalt"
          eyebrow={eyebrow}
          title={
            <>
              하루의 흐름에 맞춘 <span className="text-ng-neon">3종</span> 브레인케어
            </>
          }
          description="집중이 필요한 아침부터 하루를 정리하는 밤까지. 상황에 맞는 한 스틱을 고르세요."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col rounded-2xl border border-white/12 bg-white/[0.06] p-5 transition-colors hover:bg-white/[0.1]"
            >
              <ProductVisual
                src={imageBySlug[p.slug] ?? null}
                alt={`NUTROGIN ${p.code}`}
                tone={p.tone}
                code={p.code}
                className="aspect-[5/4] rounded-xl"
                sizes="(max-width: 768px) 90vw, 30vw"
              />
              <div className="mt-5 flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-wider text-ng-neon">{p.code}</span>
                <span className="text-sm text-white/55">{p.ko}</span>
              </div>
              <h3 className="mt-2 text-lg font-extrabold leading-snug">{p.tagline}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{p.situation}</p>
              <p className="mt-4 font-mono text-lg font-bold text-ng-neon">{priceBySlug[p.slug] ?? ""}</p>
              <div className="mt-4 flex gap-2">
                <CTAButton href={`/products/${p.slug}`} variant="onCobalt" size="sm" className="flex-1">
                  구매하기
                </CTAButton>
                <CTAButton href={`/products/${p.slug}`} variant="onCobaltGhost" size="sm">
                  상세
                </CTAButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
