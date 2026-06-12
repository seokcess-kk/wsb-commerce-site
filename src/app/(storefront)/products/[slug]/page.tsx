import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listPublishedProducts } from "@/db/queries/products";
import { ComplianceNotice } from "@/components/catalog/compliance-notice";
import { PurchasePanel } from "@/components/cart/purchase-panel";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductInfo } from "@/components/catalog/product-info";
import { RelatedProducts } from "@/components/catalog/related-products";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ReviewList } from "@/components/reviews/review-list";
import { ProductDetailSection } from "@/components/catalog/product-detail-section";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { FAQ, nutroginMeta, productDetail, relatedNutroginSlugs } from "@/lib/brand/copy";
import { buildProductJsonLd } from "@/lib/seo/product-jsonld";
import { getSiteUrl } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isWishlisted } from "@/db/queries/wishlists";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "상품" };
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
  const [product, user, allProducts] = await Promise.all([
    getProductBySlug(slug),
    getCurrentUser(),
    listPublishedProducts(),
  ]);
  if (!product) notFound();

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

  // 연관/교차 추천 — NUTROGIN 3종 중 현재 상품 제외(현재가 NUTROGIN이 아니면 3종 전부 소개).
  const relatedSet = new Set(product.isNutrogin ? relatedNutroginSlugs(product.slug) : relatedNutroginSlugs(""));
  const related = allProducts.filter((p) => relatedSet.has(p.slug));
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
        <article className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-2">
          <div className="md:sticky md:top-6 md:self-start">
            <ProductGallery images={product.images} fallbackLabel={product.name} isNutrogin={product.isNutrogin} />
          </div>

          <div>
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
              <ReviewSummary productId={product.id} />
            </div>
            {product.summary && <p className="mt-3 leading-relaxed text-stone-600">{product.summary}</p>}

            <div className="mt-4 flex items-center gap-3">
              <p className="text-2xl font-extrabold text-ng-charcoal">{product.priceLabel}</p>
              <WishlistButton productId={product.id} initialActive={initialWishlisted} />
            </div>

            <PurchasePanel
              productName={product.name}
              productSlug={product.slug}
              thumbnail={product.thumbnail}
              options={options}
              alt={altForSoldOut}
            />

            <div className="mt-6">
              <ComplianceNotice
                reviewPhraseNo={product.reviewPhraseNo}
                noticeText={product.noticeText}
                reportNo={product.reportNo}
                functionality={product.functionality}
                intakeNotice={product.intakeNotice}
              />
            </div>
          </div>
        </article>

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

        {/* 상세 설명 / 상세 이미지 */}
        <ProductDetailSection
          description={product.description}
          images={product.images}
          functionality={product.functionality}
          intakeNotice={product.intakeNotice}
          ingredients={product.ingredients}
          isNutrogin={product.isNutrogin}
          productName={product.name}
        />

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-12">
          <h2 className="mb-6 text-lg font-extrabold text-ng-charcoal">자주 묻는 질문</h2>
          <FaqAccordion items={FAQ} />
        </section>

        {/* 연관 상품 */}
        <RelatedProducts products={related} title="함께 보면 좋은 NUTROGIN" />

        {/* 리뷰 */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <ReviewList productId={product.id} />
        </section>
      </div>
    </>
  );
}
