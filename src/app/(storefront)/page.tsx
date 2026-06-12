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

export const dynamic = "force-dynamic";

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
