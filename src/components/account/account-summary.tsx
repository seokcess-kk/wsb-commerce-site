import Link from "next/link";
import { STATUS_LABEL } from "@/lib/admin/order-status";

type RecentOrder = {
  orderNumber: string;
  status: string;
};

type Props = {
  recentOrder: RecentOrder | null;
  wishlistCount: number;
  couponCount?: number;
};

const statusLabel = (s: string) => (STATUS_LABEL as Record<string, string>)[s] ?? s;

export function AccountSummary({ recentOrder, wishlistCount, couponCount = 0 }: Props) {
  return (
    <div className="grid grid-cols-3 divide-x divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {/* Recent order */}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">최근 주문</p>
        {recentOrder ? (
          <div className="mt-1">
            <Link
              href={`/account/orders/${recentOrder.orderNumber}`}
              className="block font-mono text-sm font-semibold text-wsb-green hover:underline"
            >
              {recentOrder.orderNumber}
            </Link>
            <p className="mt-0.5 text-xs text-stone-500">{statusLabel(recentOrder.status)}</p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-stone-400">주문 없음</p>
        )}
      </div>

      {/* Wishlist count */}
      <Link href="/account/wishlist" className="block p-4 hover:bg-stone-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">찜</p>
        <p className="mt-1 text-2xl font-extrabold text-wsb-carbon">{wishlistCount}</p>
      </Link>

      {/* Coupon count (slot — Stream F will supply real value) */}
      <Link href="/account/coupons" className="block p-4 hover:bg-stone-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">쿠폰</p>
        <p className="mt-1 text-2xl font-extrabold text-wsb-carbon">{couponCount}</p>
      </Link>
    </div>
  );
}
