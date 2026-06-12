import type { ProductSummary } from "@/lib/catalog/product-view";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/states";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return <EmptyState title="표시할 상품이 없습니다." />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
