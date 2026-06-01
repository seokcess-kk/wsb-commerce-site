import type { ProductSummary } from "@/lib/catalog/product-view";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-stone-500">표시할 상품이 없습니다.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
