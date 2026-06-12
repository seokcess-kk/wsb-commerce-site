import { ProductCard } from "@/components/catalog/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProductSummary } from "@/lib/catalog/product-view";

// 연관/교차 추천 — NUTROGIN 3종 교차추천 등.
export function RelatedProducts({
  products,
  title = "함께 보면 좋은 제품",
  eyebrow = "LINEUP",
}: {
  products: ProductSummary[];
  title?: string;
  eyebrow?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
