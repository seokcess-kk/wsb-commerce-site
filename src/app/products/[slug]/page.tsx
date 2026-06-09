import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/queries/products";
import { resolveVariantPriceLabel } from "@/lib/catalog/product-view";
import { ComplianceNotice } from "@/components/catalog/compliance-notice";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ReviewList } from "@/components/reviews/review-list";
import { ProductDetailSection } from "@/components/catalog/product-detail-section";
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
  const [product, user] = await Promise.all([
    getProductBySlug(slug),
    getCurrentUser(),
  ]);
  if (!product) notFound();

  const initialWishlisted = user
    ? await isWishlisted(user.id, product.id)
    : false;

  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.summary ?? product.name,
    brand: product.brand,
    priceKRW: product.basePrice,
    url: `${getSiteUrl()}/products/${product.slug}`,
    image: product.thumbnail,
    availability: product.variants.some((v) => v.stock > 0),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-2">
      <ProductGallery
        images={product.images}
        fallbackLabel={product.name}
        isNutrogin={product.isNutrogin}
      />
      <div>
        {product.isNutrogin && (
          <span className="font-mono text-xs font-bold tracking-wide text-ng-cobalt">NUTROGIN</span>
        )}
        <h1 className="mt-1 text-2xl font-extrabold text-wsb-carbon">{product.name}</h1>
        <ReviewSummary productId={product.id} />
        {product.summary && <p className="mt-2 text-stone-600">{product.summary}</p>}
        <div className="mt-4 flex items-center gap-3">
          <p className="text-2xl font-extrabold text-wsb-carbon">{product.priceLabel}</p>
          <WishlistButton productId={product.id} initialActive={initialWishlisted} />
        </div>

        <div className="mt-4 rounded-md border border-stone-200 p-3 text-sm">
          <p className="mb-2 font-semibold text-stone-700">옵션</p>
          <ul className="space-y-1 text-stone-600">
            {product.variants.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span>{v.name}{v.stock === 0 ? " (품절)" : ""}</span>
                <span className="font-mono">{resolveVariantPriceLabel(product.basePrice, v.priceDelta)}</span>
              </li>
            ))}
          </ul>
        </div>

        <AddToCartButton
          options={product.variants.map((v) => ({
            variantId: v.id,
            productSlug: product.slug,
            name: `${product.name} / ${v.name}`,
            unitPrice: product.basePrice + v.priceDelta,
            quantity: 1,
            thumbnail: product.thumbnail,
            stock: v.stock,
          }))}
        />

        {product.ingredients && (
          <p className="mt-4 text-xs text-stone-500">원료/함량: <span className="font-mono text-stone-700">{product.ingredients}</span></p>
        )}

        <div className="mt-5">
          <ComplianceNotice
            reviewPhraseNo={product.reviewPhraseNo}
            noticeText={product.noticeText}
            reportNo={product.reportNo}
            functionality={product.functionality}
            intakeNotice={product.intakeNotice}
          />
        </div>

        <div className="mt-8">
          <ReviewList productId={product.id} />
        </div>
      </div>
    </article>

    {/* 상세 정보 섹션 — 두 칸 레이아웃 아래 전체 너비 */}
    <ProductDetailSection
      description={product.description}
      images={product.images}
      functionality={product.functionality}
      intakeNotice={product.intakeNotice}
      ingredients={product.ingredients}
      isNutrogin={product.isNutrogin}
      productName={product.name}
    />
    </>
  );
}
