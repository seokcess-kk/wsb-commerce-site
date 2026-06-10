import type { Metadata } from "next";
import { Search } from "lucide-react";
import { searchProducts } from "@/db/queries/products";
import { normalizeSearchQuery } from "@/lib/catalog/search";
import { ProductGrid } from "@/components/catalog/product-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "검색",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = normalizeSearchQuery(q);
  const results = query ? await searchProducts(query) : [];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">상품 검색</h1>

      <form action="/search" method="get" className="mt-5 flex max-w-xl items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="상품명·효능으로 검색 (예: 브레인, 면역)"
            aria-label="검색어"
            autoFocus
            className="w-full rounded-md border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-wsb-green px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
        >
          검색
        </button>
      </form>

      <div className="mt-8">
        {!query ? (
          <p className="py-16 text-center text-sm text-stone-500">검색어를 입력해 주세요.</p>
        ) : results.length === 0 ? (
          <p className="py-16 text-center text-sm text-stone-500">
            <span className="font-semibold text-wsb-carbon">&lsquo;{query}&rsquo;</span> 에 대한 검색 결과가 없습니다.
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-stone-500">
              <span className="font-semibold text-wsb-carbon">&lsquo;{query}&rsquo;</span> 검색 결과 {results.length}건
            </p>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </section>
  );
}
