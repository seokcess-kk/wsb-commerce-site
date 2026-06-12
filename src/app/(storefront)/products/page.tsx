import { listPublishedProducts, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { SortSelect } from "@/components/catalog/sort-select";
import { PriceFilter } from "@/components/catalog/price-filter";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { ProductComparisonTable } from "@/components/catalog/product-comparison-table";
import { BRAND } from "@/lib/brand/copy";
import type { SortKey } from "@/lib/catalog/sort";
import { SORT_OPTIONS } from "@/lib/catalog/sort";
import { PRICE_PRESETS, parsePricePreset } from "@/lib/catalog/price-presets";

export const dynamic = "force-dynamic";

export const metadata = { title: "전체 상품" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const sort = (SORT_OPTIONS.some((o) => o.key === params.sort) ? params.sort : "newest") as SortKey;
  const { minPrice, maxPrice } = parsePricePreset(params.price);

  const [products, categories, allProducts] = await Promise.all([
    listPublishedProducts({ sort, minPrice, maxPrice }),
    listCategories(),
    listPublishedProducts(),
  ]);

  const priceBySlug: Record<string, string> = {};
  for (const p of allProducts) priceBySlug[p.slug] = p.priceLabel;

  return (
    <div>
      <CatalogHero eyebrow="LINEUP" title="NUTROGIN 라인업" description={`${BRAND.sloganKo}. 집중·맑은 각성·숙면 회복을 위한 브레인케어 3종.`} />

      <ProductComparisonTable priceBySlug={priceBySlug} />

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-lg font-extrabold text-ng-charcoal">전체 상품</h2>
        <div className="mt-5">
          <CategoryFilter categories={categories} activeSlug={null} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <PriceFilter presets={PRICE_PRESETS} activePreset={params.price} currentSort={sort} />
          <SortSelect currentSort={sort} />
        </div>
        <p className="mt-4 text-sm text-stone-500">총 {products.length}개</p>
        <div className="mt-4">
          {products.length === 0 ? (
            <p className="py-16 text-center text-sm text-stone-400">해당 조건의 상품이 없습니다.</p>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </section>
    </div>
  );
}
