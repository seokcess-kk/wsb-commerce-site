import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listWishlist } from "@/db/queries/wishlists";
import { ProductGrid } from "@/components/catalog/product-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "찜한 상품",
  robots: { index: false },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/wishlist");

  const products = await listWishlist(user.id);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/account" className="text-sm text-wsb-green">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-wsb-carbon">찜한 상품</h1>
      <div className="mt-6">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-stone-500">찜한 상품이 없습니다.</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-semibold text-wsb-green hover:underline"
            >
              상품 둘러보기 →
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </section>
  );
}
