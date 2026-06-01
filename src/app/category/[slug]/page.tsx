import { notFound } from "next/navigation";
import { listProductsByCategory, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await listCategories();
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();
  const products = await listProductsByCategory(slug);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">{current.name}</h1>
      <div className="mt-5">
        <CategoryFilter categories={categories} activeSlug={slug} />
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
