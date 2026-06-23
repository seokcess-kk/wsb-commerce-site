import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listProductsBySlugs } from "@/db/queries/products";
import { ComplianceNotice } from "@/components/catalog/compliance-notice";
import { PurchasePanel } from "@/components/cart/purchase-panel";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductAssurance } from "@/components/catalog/product-assurance";
import { ProductInfo } from "@/components/catalog/product-info";
import { RelatedProducts } from "@/components/catalog/related-products";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ReviewList } from "@/components/reviews/review-list";
import { ProductDetailSection } from "@/components/catalog/product-detail-section";
import { NutroginDetailImage } from "@/components/catalog/nutrogin-detail-image";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { FAQ, GENERIC_FAQ, nutroginMeta, productDetail, relatedNutroginSlugs } from "@/lib/brand/copy";
import { buildProductJsonLd } from "@/lib/seo/product-jsonld";
import { getSiteUrl } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isWishlisted } from "@/db/queries/wishlists";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  // 메타데이터 단계에서 notFound() — 본문 스트리밍(streaming metadata) 전에 404 상태를 확정한다(soft-404 방지).
  if (!product) notFound();
  return {
    title: product.name,
    description: product.summary ?? product.name,
    openGraph: {
      title: product.name,
      description: product.summary ?? product.name,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // 존재 확인을 쿠키 접근(getCurrentUser)보다 먼저 — 동적 API(cookies) 접근이 응답 스트리밍을
  // 시작시켜 notFound() 가 soft-404(HTTP 200)가 되는 것을 막는다. getProductBySlug 는 layout 과
  // 공유되는 cache() 라 추가 쿼리가 없다.
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // 연관/교차 추천 — NUTROGIN 3종 중 현재 상품 제외(현재가 NUTROGIN이 아니면 3종 전부 소개).
  // 전체 상품을 로드해 필터링하던 것을 필요한 슬러그만 조회로 교체(쿼리 다이어트).
  const relatedSlugs = product.isNutrogin ? relatedNutroginSlugs(product.slug) : relatedNutroginSlugs("");
  const [user, related] = await Promise.all([getCurrentUser(), listProductsBySlugs(relatedSlugs)]);
  const initialWishlisted = user ? await isWishlisted(user.id, product.id) : false;

  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.summary ?? product.name,
    brand: product.brand,
    priceKRW: product.basePrice,
    url: `${getSiteUrl()}/products/${product.slug}`,
    image: product.thumbnail,
    availability: product.variants.some((v) => v.stock > 0),
  });

  const meta = nutroginMeta(product.slug);
  const detail = productDetail(product.slug);

  const altForSoldOut = related.map((p) => {
    const m = nutroginMeta(p.slug);
    return { slug: p.slug, code: m?.code ?? "", ko: m?.ko ?? p.name };
  });

  const options = product.variants.map((v) => ({
    variantId: v.id,
    label: v.name,
    unitPrice: product.basePrice + v.priceDelta,
    stock: v.stock,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pb-28 md:pb-0">
        <article className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-2 md:items-stretch">
          <div>
            <ProductGallery images={product.images} fallbackLabel={product.name} isNutrogin={product.isNutrogin} />
          </div>

          <div className="md:flex md:flex-col">
            {product.isNutrogin && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-wide text-ng-cobalt">
                  NUTROGIN{meta ? ` ${meta.code}` : ""}
                </span>
                <span className="rounded-full bg-ng-charcoal px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-ng-neon">
                  BRAINCARE
                </span>
              </div>
            )}
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ng-charcoal md:text-3xl">{product.name}</h1>
            {meta && <p className="mt-1.5 text-sm text-stone-500">{meta.tagline}</p>}
            <div className="mt-3">
              {/* 리뷰 요약은 별도 쿼리 — Suspense 로 분리해 본문이 먼저 렌더되게 한다(스트리밍). */}
              <Suspense fallback={<div className="h-5 w-32 animate-pulse rounded bg-stone-100" />}>
                <ReviewSummary productId={product.id} />
              </Suspense>
            </div>
            {product.summary && <p className="mt-3 leading-relaxed text-stone-600">{product.summary}</p>}

            <div className="mt-4 flex items-center gap-3">
              <p className="text-2xl font-extrabold text-ng-charcoal">{product.priceLabel}</p>
              <WishlistButton productId={product.id} initialActive={initialWishlisted} />
            </div>

            {/* 구매 패널 — 우측 컬럼 하단에 고정해 좌측 트러스트 블록 하단과 정렬 */}
            <div className="md:mt-auto">
              <PurchasePanel
                productName={product.name}
                productSlug={product.slug}
                thumbnail={product.thumbnail}
                options={options}
                alt={altForSoldOut}
              />
            </div>
          </div>
        </article>

        {/* 좌: 배송·교환·정품 안심 정보 / 우: 건강기능식품 표시·광고 심의필 — 좌우 분할 */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
            <ProductAssurance />
            <ComplianceNotice
              reviewPhraseNo={product.reviewPhraseNo}
              noticeText={product.noticeText}
              reportNo={product.reportNo}
              functionality={product.functionality}
              intakeNotice={product.intakeNotice}
            />
          </div>
        </div>

        {/* 제품 정보 — 구매 판단에 필요한 핵심 사실(숨기지 않음) */}
        {(detail || product.ingredients || product.functionality) && (
          <section className="mx-auto max-w-6xl px-6 py-6">
            <h2 className="mb-4 text-lg font-extrabold text-ng-charcoal">제품 정보</h2>
            <ProductInfo
              composition={detail?.composition}
              intake={detail?.intake}
              storage={detail?.storage}
              audience={detail?.audience}
              ingredients={product.ingredients}
              functionality={product.functionality}
            />
          </section>
        )}

        {/* 상세 설명 / 상세 이미지 — NUTROGIN은 브랜드 롱폼 상세, 그 외는 기본 섹션 */}
        {product.isNutrogin ? (
          <NutroginDetailImage slug={product.slug} productName={product.name} />
        ) : (
          <ProductDetailSection
            description={product.description}
            images={product.images}
            functionality={product.functionality}
            intakeNotice={product.intakeNotice}
            ingredients={product.ingredients}
            isNutrogin={product.isNutrogin}
            productName={product.name}
          />
        )}

        {/* FAQ — NUTROGIN(스틱)은 전용 FAQ, 그 외 상품은 제형 중립 공통 FAQ(섭취법 오안내 방지) */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-6 text-lg font-extrabold text-ng-charcoal">자주 묻는 질문</h2>
          <FaqAccordion items={product.isNutrogin ? FAQ : GENERIC_FAQ} />
        </section>

        {/* 연관 상품 — NUTROGIN 라인업 교차 추천 */}
        <RelatedProducts
          products={related}
          title={product.isNutrogin ? "함께 보면 좋은 NUTROGIN" : "NUTROGIN 라인업도 만나보세요"}
        />

        {/* 리뷰 — 별도 쿼리라 Suspense 로 분리 스트리밍(본문/구매 영역을 막지 않음) */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <Suspense fallback={<p className="text-sm text-stone-400">리뷰를 불러오는 중…</p>}>
            <ReviewList productId={product.id} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
