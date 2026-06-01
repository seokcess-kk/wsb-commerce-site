import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderAdmin } from "@/db/queries/admin-orders";
import { STATUS_LABEL, nextStatuses } from "@/lib/admin/order-status";
import { updateOrderStatus, updateShipping } from "../actions";
import { formatKRW } from "@/lib/format";

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

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-wsb-green">
        ← 주문관리
      </Link>
      <h1 className="mt-2 font-mono text-xl font-extrabold text-wsb-carbon">
        {order.orderNumber}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        현재 상태:{" "}
        <strong>{STATUS_LABEL[order.status as keyof typeof STATUS_LABEL] ?? order.status}</strong>
      </p>

      <ul className="mt-5 divide-y divide-stone-200 rounded-lg border border-stone-200">
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

      <div className="mt-4 text-sm text-stone-600">
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
              <button className="rounded-md border border-wsb-green px-3 py-1.5 text-sm font-semibold text-wsb-green hover:bg-wsb-green/5">
                {STATUS_LABEL[s]}로 변경
              </button>
            </form>
          );
        })}
        {next.length === 0 && (
          <span className="text-sm text-stone-400">변경 가능한 상태가 없습니다.</span>
        )}
      </div>

      <form action={updateShipping} className="mt-6 flex flex-wrap items-end gap-2 border-t border-stone-200 pt-4">
        <input type="hidden" name="orderNumber" value={order.orderNumber} />
        <label className="text-sm">
          택배사
          <input
            name="courier"
            defaultValue={order.courier ?? ""}
            className="mt-1 block rounded-md border border-stone-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm">
          송장번호
          <input
            name="trackingNumber"
            defaultValue={order.trackingNumber ?? ""}
            className="mt-1 block rounded-md border border-stone-300 px-2 py-1 text-sm"
          />
        </label>
        <button className="rounded-md bg-wsb-green px-3 py-2 text-sm font-bold text-white">
          송장 저장
        </button>
      </form>
    </div>
  );
}
