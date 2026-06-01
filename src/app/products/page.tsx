import { listPublishedProducts, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([listPublishedProducts(), listCategories()]);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">전체 상품</h1>
      <div className="mt-5">
        <CategoryFilter categories={categories} activeSlug={null} />
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
