import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPublishedProducts, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { SortSelect } from "@/components/catalog/sort-select";
import { PriceFilter } from "@/components/catalog/price-filter";
import type { SortKey } from "@/lib/catalog/sort";
import { SORT_OPTIONS } from "@/lib/catalog/sort";

export const dynamic = "force-dynamic";

const PRICE_PRESETS = [
  { label: "전체", min: undefined, max: undefined },
  { label: "~1만", min: undefined, max: 10000 },
  { label: "1~3만", min: 10000, max: 30000 },
  { label: "3만~", min: 30000, max: undefined },
] as const;

function parsePricePreset(preset: string | undefined) {
  if (!preset) return { min: undefined, max: undefined };
  const found = PRICE_PRESETS.find(
    (p) => `${p.min ?? ""}-${p.max ?? ""}` === preset,
  );
  return { min: found?.min, max: found?.max };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listCategories();
  const current = categories.find((c) => c.slug === slug);
  return { title: current?.name ?? "카테고리" };
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

  const sort = (SORT_OPTIONS.some((o) => o.key === sp.sort)
    ? sp.sort
    : "newest") as SortKey;
  const { min: minPrice, max: maxPrice } = parsePricePreset(sp.price);

  const categories = await listCategories();
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();

  const products = await listPublishedProducts({
    sort,
    minPrice,
    maxPrice,
    categorySlug: slug,
  });

  const basePath = `/category/${slug}`;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">{current.name}</h1>
      <div className="mt-5">
        <CategoryFilter categories={categories} activeSlug={slug} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PriceFilter presets={PRICE_PRESETS} activePreset={sp.price} basePath={basePath} />
        <SortSelect currentSort={sort} />
      </div>
      <p className="mt-4 text-sm text-stone-500">총 {products.length}개</p>
      <div className="mt-4">
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-stone-400">
            해당 조건의 상품이 없습니다.
          </p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </section>
  );
}
