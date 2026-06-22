"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { toggleWishlistAction } from "@/app/(storefront)/account/wishlist/actions";
import type { ProductSummary } from "@/lib/catalog/product-view";

// 찜 목록 — 각 카드에 찜 해제 버튼. 해제 시 toggleWishlistAction 호출 후 목록에서 즉시 제거(낙관적).
export function WishlistGrid({ initialProducts }: { initialProducts: ProductSummary[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await toggleWishlistAction(id);
        if (!("unauthorized" in res) && !res.active) {
          setProducts((prev) => prev.filter((p) => p.id !== id));
        }
      } finally {
        setPendingId(null);
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-stone-500">찜한 상품이 없습니다.</p>
        <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-ng-cobalt hover:underline">
          상품 둘러보기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <ProductCard product={product} />
          <button
            type="button"
            onClick={() => remove(product.id)}
            disabled={pendingId === product.id}
            aria-label={`${product.name} 찜 해제`}
            className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-rose-600 shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt disabled:opacity-50"
          >
            {pendingId === product.id ? "해제 중…" : "♥ 찜 해제"}
          </button>
        </div>
      ))}
    </div>
  );
}
