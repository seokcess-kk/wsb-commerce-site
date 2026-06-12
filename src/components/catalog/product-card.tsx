import Link from "next/link";
import { ProductVisual } from "./product-visual";
import { nutroginMeta } from "@/lib/brand/copy";
import type { ProductSummary } from "@/lib/catalog/product-view";

export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const meta = product.isNutrogin ? nutroginMeta(product.slug) : null;
  const tone = meta?.tone ?? "wsb";
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:border-ng-cobalt/40 hover:shadow-[0_12px_32px_-16px_rgba(0,71,255,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
    >
      <ProductVisual
        src={product.thumbnail}
        alt={product.name}
        tone={tone}
        code={meta?.code}
        className="aspect-[4/5]"
        sizes="(max-width: 768px) 50vw, 25vw"
        priority={priority}
      />
      <div className="p-4">
        {product.isNutrogin ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wide text-ng-cobalt">
            <span className="h-1.5 w-1.5 rounded-full bg-ng-neon" aria-hidden />
            NUTROGIN {meta?.code}
          </span>
        ) : (
          <span className="font-mono text-[10px] font-bold tracking-wide text-stone-400">{product.categoryName ?? "WSB"}</span>
        )}
        <h3 className="mt-1 text-sm font-bold text-ng-charcoal">{product.name}</h3>
        {product.summary && <p className="mt-1 line-clamp-1 text-xs text-stone-500">{product.summary}</p>}
        <p className="mt-2 text-base font-extrabold text-ng-charcoal">{product.priceLabel}</p>
      </div>
    </Link>
  );
}
