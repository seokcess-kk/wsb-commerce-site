import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOrderDetailForUser } from "@/db/queries/orders";
import { formatKRW } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/admin/order-status";

export const dynamic = "force-dynamic";

const statusLabel = (s: string) => (STATUS_LABEL as Record<string, string>)[s] ?? s;

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const detail = await getOrderDetailForUser(user.id, orderNumber);
  if (!detail) notFound();
  const { order, items } = detail;
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/account" className="text-sm text-wsb-green">← 마이페이지</Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-mono text-xl font-extrabold text-wsb-carbon">{order.orderNumber}</h1>
        <span className="rounded-full bg-wsb-green/10 px-2.5 py-0.5 text-xs font-semibold text-wsb-green">{statusLabel(order.status)}</span>
      </div>

      {order.trackingNumber ? (
        <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
          <p className="font-semibold text-wsb-carbon">배송 정보</p>
          <div className="mt-2 flex justify-between text-stone-600">
            <span>택배사</span><span>{order.courier ?? "-"}</span>
          </div>
          <div className="mt-1 flex justify-between text-stone-600">
            <span>송장번호</span><span className="font-mono">{order.trackingNumber}</span>
          </div>
        </div>
      ) : order.status === "preparing" ? (
        <p className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">상품을 준비 중입니다. 발송되면 송장번호가 등록됩니다.</p>
      ) : null}
      <ul className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between p-4 text-sm">
            <span>{it.productName} <span className="text-stone-400">/ {it.variantName}</span> × {it.quantity}</span>
            <span className="font-mono font-bold">{formatKRW(it.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-stone-500">상품 합계</dt><dd className="font-mono">{formatKRW(order.itemsSubtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-500">배송비</dt><dd className="font-mono">{formatKRW(order.shippingFee)}</dd></div>
        <div className="flex justify-between border-t border-stone-200 pt-1 font-extrabold"><dt>총 결제금액</dt><dd className="font-mono">{formatKRW(order.totalAmount)}</dd></div>
      </dl>
      <div className="mt-4 text-sm text-stone-600">
        <p>받는 분: {order.customerName} ({order.customerPhone})</p>
        <p>배송지: {order.shippingAddress}</p>
      </div>
    </section>
  );
}
