import { PRODUCTS, BRAND, nutroginAsset } from "@/lib/brand/copy";
import { ProductVisual } from "@/components/catalog/product-visual";
import { CTAButton } from "@/components/ui/cta-button";

// 히어로 — 풀블리드 코발트 + 네온 강조 + 한글 헤드라인 + 슬로건 + 제품 타일 클러스터 + 1차 CTA.
// 어드민 배너에 의존하지 않고 항상 동일한 브랜드 첫인상을 보장한다.
export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ng-cobalt text-white">
      {/* 배경: 네온 글로우 + 미세 그리드 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-ng-neon/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        {/* 카피 */}
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-ng-neon">{BRAND.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
            또렷한 머리,
            <br />
            <span className="text-ng-neon">맑은 하루</span>.
          </h1>
          <p className="mt-5 font-mono text-sm tracking-wide text-white/70">{BRAND.sloganEn}</p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
            생각이 많은 시대, 머리를 맑게 깨우는 브레인케어 젤리. 집중·각성·회복이 필요한 순간을 위한 하루 한 스틱의 루틴.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <CTAButton href="#lineup" variant="onCobalt" size="lg">
              지금 구매하기
            </CTAButton>
            <CTAButton href="#situation" variant="onCobaltGhost" size="lg">
              내게 맞는 제품 찾기
            </CTAButton>
          </div>
          <ul className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-white/55">
            <li>5만원 이상 무료배송</li>
            <li className="text-ng-neon/50" aria-hidden>/</li>
            <li>하루 한 스틱</li>
            <li className="text-ng-neon/50" aria-hidden>/</li>
            <li>물 없이 간편 섭취</li>
          </ul>
        </div>

        {/* 제품 타일 클러스터 */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {PRODUCTS.map((p, i) => (
            <ProductVisual
              key={p.slug}
              src={nutroginAsset(p.slug)?.box ?? null}
              alt={`NUTROGIN ${p.code} 외박스`}
              tone={p.tone}
              code={p.code}
              className={`aspect-[3/4] rounded-2xl ring-1 ring-white/15 ${i === 1 ? "md:-translate-y-5" : ""}`}
              sizes="(max-width: 768px) 30vw, 18vw"
              priority={i === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
