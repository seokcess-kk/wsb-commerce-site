import Link from "next/link";
import type { ProductSummary } from "@/lib/catalog/product-view";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-stone-200 transition-colors hover:border-wsb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
    >
      <div
        className={`flex h-40 items-center justify-center ${
          product.isNutrogin ? "bg-ng-cobalt/10 text-ng-cobalt" : "bg-stone-100 text-stone-400"
        }`}
      >
        <span aria-hidden="true" className="font-mono text-xs">
          {product.thumbnail ? "" : "이미지 준비중"}
        </span>
      </div>
      <div className="p-3">
        {product.isNutrogin && (
          <span className="font-mono text-[10px] font-bold tracking-wide text-ng-cobalt">NUTROGIN</span>
        )}
        <h3 className="mt-0.5 text-sm font-semibold text-wsb-carbon">{product.name}</h3>
        <p className="mt-1 text-sm font-extrabold text-wsb-carbon">{product.priceLabel}</p>
      </div>
    </Link>
  );
}
