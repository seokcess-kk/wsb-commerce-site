import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderAdmin } from "@/db/queries/admin-orders";
import { STATUS_LABEL, nextStatuses, isCancellableByAdmin } from "@/lib/admin/order-status";
import { updateOrderStatus, updateShipping } from "../actions";
import { OrderCancelButton } from "@/components/admin/order-cancel-button";
import { formatKRW } from "@/lib/format";
import { trackingUrl, SUPPORTED_COURIERS } from "@/lib/orders/tracking";
import { AdminCard } from "@/components/admin/ui/card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const detail = await getOrderAdmin(orderNumber);
  if (!detail) notFound();
  const { order, items } = detail;
  const next = nextStatuses(order.status);
  const trackUrl = trackingUrl(order.courier, order.trackingNumber);

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-[var(--ad-accent)]">
        ← 주문관리
      </Link>
      <h1 className="mt-2 font-mono text-xl font-extrabold text-[var(--ad-ink)]">
        {order.orderNumber}
      </h1>
      <p className="mt-1 text-sm text-[var(--ad-mut)]">
        현재 상태:{" "}
        <StatusBadge value={order.status} />
      </p>

      <AdminCard className="mt-5">
        <ul className="divide-y divide-[var(--ad-line)]">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between p-3 text-sm">
              <span>
                {it.productName} / {it.variantName} × {it.quantity}
              </span>
              <span className="font-mono">{formatKRW(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-sm">
          총 결제 <strong className="font-mono">{formatKRW(order.totalAmount)}</strong>
        </p>
      </AdminCard>

      <div className="mt-4 text-sm text-[var(--ad-mut)]">
        <p>
          받는 분: {order.customerName} ({order.customerPhone})
        </p>
        <p>배송지: {order.shippingAddress}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {next.map((s) => {
          async function changeStatus() {
            "use server";
            await updateOrderStatus(order.orderNumber, s);
          }
          return (
            <form key={s} action={changeStatus}>
              <AdminButton variant="ghost">
                {STATUS_LABEL[s]}로 변경
              </AdminButton>
            </form>
          );
        })}
        {next.length === 0 && !isCancellableByAdmin(order.status) && (
          <span className="text-sm text-[var(--ad-mut-2)]">변경 가능한 상태가 없습니다.</span>
        )}
      </div>

      {isCancellableByAdmin(order.status) && (
        <div className="mt-4">
          <OrderCancelButton orderNumber={order.orderNumber} />
        </div>
      )}

      <AdminCard className="mt-6">
        <form action={updateShipping} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="orderNumber" value={order.orderNumber} />
          <label className="text-sm text-[var(--ad-mut)]">
            택배사
            <AdminInput
              name="courier"
              defaultValue={order.courier ?? ""}
              list="courier-list"
              className="mt-1 block"
            />
            <datalist id="courier-list">
              {SUPPORTED_COURIERS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="text-sm text-[var(--ad-mut)]">
            송장번호
            <AdminInput
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="mt-1 block"
            />
          </label>
          <AdminButton type="submit">송장 저장</AdminButton>
        </form>
      </AdminCard>

      {order.trackingNumber && (
        <p className="mt-3 text-sm text-[var(--ad-mut)]">
          배송조회:{" "}
          {trackUrl ? (
            <a
              href={trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--ad-accent)] hover:underline font-mono"
            >
              {order.courier} {order.trackingNumber} ↗
            </a>
          ) : (
            <span className="font-mono text-[var(--ad-mut-2)]">
              {order.courier} {order.trackingNumber}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
