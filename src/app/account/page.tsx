import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutList,
  Heart,
  Tag,
  MapPin,
  Star,
  MessageCircle,
  UserCog,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOrdersByUser } from "@/db/queries/orders";
import { countWishlist } from "@/db/queries/wishlists";
import { listUserCoupons } from "@/db/queries/coupons";
import { AccountSummary } from "@/components/account/account-summary";
import { OrderList } from "@/components/account/order-list";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/account", label: "주문내역", icon: LayoutList },
  { href: "/account/wishlist", label: "찜 목록", icon: Heart },
  { href: "/account/coupons", label: "쿠폰함", icon: Tag },
  { href: "/account/addresses", label: "배송지 관리", icon: MapPin },
  { href: "/account/reviews", label: "내 리뷰", icon: Star },
  { href: "/account/inquiries", label: "1:1 문의", icon: MessageCircle },
  { href: "/account/profile", label: "회원정보 수정", icon: UserCog },
];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status } = await searchParams;

  const [orders, wishlistCount, userCoupons] = await Promise.all([
    listOrdersByUser(user.id, { status }),
    countWishlist(user.id),
    listUserCoupons(user.id),
  ]);

  const availableCouponCount = userCoupons.filter((uc) => !uc.usedAt).length;

  // Most recent order for summary (all orders, unfiltered by status)
  const allOrders = status
    ? await listOrdersByUser(user.id)
    : orders;
  const recentOrder = allOrders[0]
    ? { orderNumber: allOrders[0].orderNumber, status: allOrders[0].status }
    : null;

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-wsb-carbon">마이페이지</h1>
        <Link
          href="/account/profile"
          className="text-sm font-semibold text-wsb-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2 rounded-sm"
        >
          회원정보 수정
        </Link>
      </div>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>

      {/* Summary card */}
      <div className="mt-6">
        <AccountSummary
          recentOrder={recentOrder}
          wishlistCount={wishlistCount}
          couponCount={availableCouponCount}
        />
      </div>

      {/* Navigation grid */}
      <nav
        aria-label="마이페이지 메뉴"
        className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-7"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-stone-200 px-2 py-4 text-center text-xs font-medium text-stone-600 transition-colors hover:border-wsb-green/40 hover:bg-wsb-green/5 hover:text-wsb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
          >
            <Icon size={20} strokeWidth={1.75} className="text-wsb-carbon" aria-hidden />
            <span className="leading-tight">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Order list section */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-wsb-carbon">주문 내역</h2>
        <OrderList orders={orders} activeStatus={status ?? ""} />
      </div>
    </section>
  );
}
