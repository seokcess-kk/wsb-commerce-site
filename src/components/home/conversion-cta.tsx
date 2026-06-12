import { PRODUCTS, HEALTH_DISCLAIMER } from "@/lib/brand/copy";
import { CTAButton } from "@/components/ui/cta-button";

// 하단 전환 CTA — 다시 한 번 구매로 연결. 3종 바로가기 + 전체 라인업.
export function ConversionCta() {
  return (
    <section className="border-t-2 border-ng-neon bg-ng-cobalt px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-4xl">
          지금 필요한 <span className="text-ng-neon">브레인케어 루틴</span>을 선택하세요
        </h2>
        <p className="mt-4 text-white/75">집중력 · 맑은 각성 · 숙면 회복 — 하루의 흐름에 맞게.</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {PRODUCTS.map((p) => (
            <CTAButton key={p.slug} href={`/products/${p.slug}`} variant="onCobaltGhost" size="md">
              {p.code} {p.ko}
            </CTAButton>
          ))}
        </div>
        <div className="mt-6">
          <CTAButton href="/products" variant="neon" size="lg">
            전체 라인업 보기
          </CTAButton>
        </div>

        <p className="mt-8 font-mono text-[11px] text-white/45">{HEALTH_DISCLAIMER}</p>
      </div>
    </section>
  );
}
