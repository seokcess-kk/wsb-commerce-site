import { listPublishedProducts, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { SortSelect } from "@/components/catalog/sort-select";
import { PriceFilter } from "@/components/catalog/price-filter";
import type { SortKey } from "@/lib/catalog/sort";
import { SORT_OPTIONS } from "@/lib/catalog/sort";

export const dynamic = "force-dynamic";

export const metadata = { title: "전체 상품" };

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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const sort = (SORT_OPTIONS.some((o) => o.key === params.sort)
    ? params.sort
    : "newest") as SortKey;
  const { min: minPrice, max: maxPrice } = parsePricePreset(params.price);

  const [products, categories] = await Promise.all([
    listPublishedProducts({ sort, minPrice, maxPrice }),
    listCategories(),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">전체 상품</h1>
      <div className="mt-5">
        <CategoryFilter categories={categories} activeSlug={null} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PriceFilter presets={PRICE_PRESETS} activePreset={params.price} />
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
