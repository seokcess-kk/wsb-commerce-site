import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPublishedProducts, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { SortSelect } from "@/components/catalog/sort-select";
import { PriceFilter } from "@/components/catalog/price-filter";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { ProductComparisonTable } from "@/components/catalog/product-comparison-table";
import type { SortKey } from "@/lib/catalog/sort";
import { SORT_OPTIONS } from "@/lib/catalog/sort";
import { PRICE_PRESETS, parsePricePreset } from "@/lib/catalog/price-presets";

export const dynamic = "force-dynamic";

// NUTROGIN 3종이 속한 카테고리 — 여기서만 비교 테이블을 노출한다.
const NUTROGIN_CATEGORY = "brain-focus";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories();
  const current = categories.find((c) => c.slug === slug);
  // 메타데이터 단계에서 notFound() — 본문 스트리밍 전에 404 상태를 확정한다(soft-404 방지).
  if (!current) notFound();
  return { title: current.name };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const sort = (SORT_OPTIONS.some((o) => o.key === sp.sort) ? sp.sort : "newest") as SortKey;
  const { minPrice, maxPrice } = parsePricePreset(sp.price);

  const categories = await listCategories();
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();

  const isNutroginCategory = slug === NUTROGIN_CATEGORY;
  const [products, allProducts] = await Promise.all([
    listPublishedProducts({ sort, minPrice, maxPrice, categorySlug: slug }),
    isNutroginCategory ? listPublishedProducts() : Promise.resolve([]),
  ]);

  const priceBySlug: Record<string, string> = {};
  for (const p of allProducts) priceBySlug[p.slug] = p.priceLabel;

  const basePath = `/category/${slug}`;

  return (
    <div>
      <CatalogHero eyebrow="CATEGORY" title={current.name} />

      {isNutroginCategory && <ProductComparisonTable priceBySlug={priceBySlug} />}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mt-1">
          <CategoryFilter categories={categories} activeSlug={slug} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <PriceFilter presets={PRICE_PRESETS} activePreset={sp.price} basePath={basePath} currentSort={sort} />
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
