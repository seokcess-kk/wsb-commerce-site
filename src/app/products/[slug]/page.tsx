import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/queries/products";
import { resolveVariantPriceLabel } from "@/lib/catalog/product-view";
import { ComplianceNotice } from "@/components/catalog/compliance-notice";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const zone = product.isNutrogin
    ? "bg-ng-cobalt text-white border-t-2 border-ng-neon"
    : "bg-stone-100 text-stone-400";
  return (
    <article className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-2">
      <div className={`flex min-h-80 items-center justify-center rounded-lg ${zone}`}>
        <span className={`font-mono text-sm${product.isNutrogin ? " text-ng-neon" : ""}`}>{product.name}</span>
      </div>
      <div>
        {product.isNutrogin && (
          <span className="font-mono text-xs font-bold tracking-wide text-ng-cobalt">NUTROGIN</span>
        )}
        <h1 className="mt-1 text-2xl font-extrabold text-wsb-carbon">{product.name}</h1>
        {product.summary && <p className="mt-2 text-stone-600">{product.summary}</p>}
        <p className="mt-4 text-2xl font-extrabold text-wsb-carbon">{product.priceLabel}</p>

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
      </div>
    </article>
  );
}
