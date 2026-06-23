import type { Metadata } from "next";
import { listPublishedProducts } from "@/db/queries/products";
import { BRAND } from "@/lib/brand/copy";
import { HomeHero } from "@/components/home/home-hero";
import { ConceptSection } from "@/components/home/concept-section";
import { NutroginLineup } from "@/components/nutrogin/nutrogin-lineup";
import { SituationRecommend } from "@/components/home/situation-recommend";
import { BrandTrust } from "@/components/home/brand-trust";
import { RoutineSection } from "@/components/home/routine-section";
import { HomeReviews } from "@/components/home/home-reviews";
import { HomeFaq } from "@/components/home/home-faq";
import { ConversionCta } from "@/components/home/conversion-cta";

// 정적 프리렌더 + ISR. 레이아웃이 더 이상 쿠키를 읽지 않아(헤더 인증 클라이언트화) 정적 생성이 가능하다.
// 카탈로그 데이터는 'catalog' 태그라 어드민 상품 변경 시 즉시 재생성되고, revalidate 는 안전망이다.
// 정적 페이지라 Link 프리페치가 전체 페이로드를 받아 클릭 시 즉시 이동한다.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} ${BRAND.line} — ${BRAND.sloganKo}` },
  description:
    "집중·맑은 각성·숙면 회복을 위한 브레인케어 젤리 NUTROGIN. FOCUS·CLEAR·REST 3종, 하루 한 스틱의 데일리 루틴.",
  openGraph: {
    title: `${BRAND.name} ${BRAND.line} — ${BRAND.sloganKo}`,
    description: "또렷한 머리, 맑은 하루. NUTROGIN 브레인케어 3종 — 집중 · 맑은 각성 · 숙면 회복.",
  },
};

export default async function HomePage() {
  const products = await listPublishedProducts();
  const priceBySlug: Record<string, string> = {};
  const imageBySlug: Record<string, string | null> = {};
  for (const p of products) {
    priceBySlug[p.slug] = p.priceLabel;
    imageBySlug[p.slug] = p.thumbnail;
  }

  return (
    <>
      <HomeHero />
      <ConceptSection />
      <div id="lineup" className="scroll-mt-16">
        <NutroginLineup priceBySlug={priceBySlug} imageBySlug={imageBySlug} />
      </div>
      <SituationRecommend />
      <BrandTrust />
      <RoutineSection />
      <HomeReviews />
      <HomeFaq />
      <ConversionCta />
    </>
  );
}
