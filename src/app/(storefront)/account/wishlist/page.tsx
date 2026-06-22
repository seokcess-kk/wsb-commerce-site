import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listWishlist } from "@/db/queries/wishlists";
import { WishlistGrid } from "@/components/wishlist/wishlist-grid";

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
      <Link href="/account" className="text-sm text-ng-cobalt">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ng-charcoal">찜한 상품</h1>
      <div className="mt-6">
        <WishlistGrid initialProducts={products} />
      </div>
    </section>
  );
}
