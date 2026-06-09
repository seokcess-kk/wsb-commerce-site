import Link from "next/link";
import { formatKRW, formatDate } from "@/lib/format";
import { statusLabel } from "@/lib/admin/order-status";
import type { OrderSummaryRow } from "@/db/queries/orders";

export type OrderListTab = {
  label: string;
  value: string;
};

const TABS: OrderListTab[] = [
  { label: "전체", value: "" },
  { label: "결제 완료", value: "paid" },
  { label: "배송 준비", value: "preparing" },
  { label: "발송 완료", value: "shipped" },
  { label: "배송 완료", value: "delivered" },
  { label: "취소", value: "cancelled" },
];

type Props = {
  orders: OrderSummaryRow[];
  activeStatus?: string;
  baseHref?: string;
};

export function OrderList({ orders, activeStatus = "", baseHref = "/account" }: Props) {
  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="주문 상태 필터">
        {TABS.map((tab) => {
          const isActive = tab.value === activeStatus;
          const href = tab.value
            ? `${baseHref}?status=${tab.value}`
            : baseHref;
          return (
            <Link
              key={tab.value}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={[
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-wsb-green text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Order list */}
      {orders.length === 0 ? (
        <p className="mt-8 text-center text-sm text-stone-500">주문 내역이 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="block rounded-lg border border-stone-200 p-4 transition-colors hover:border-wsb-green/40 hover:bg-wsb-green/5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-wsb-carbon">
                    {order.orderNumber}
                  </span>
                  <span className="rounded-full bg-wsb-green/10 px-2.5 py-0.5 text-xs font-semibold text-wsb-green">
                    {statusLabel(order.status)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-stone-500">
                  <span>
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="font-mono font-semibold text-wsb-carbon">
                    {formatKRW(order.totalAmount)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
