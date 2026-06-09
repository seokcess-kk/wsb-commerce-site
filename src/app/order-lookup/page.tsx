import Link from "next/link";
import { getGuestOrder } from "@/db/queries/orders";
import { formatKRW } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/admin/order-status";
import { trackingUrl } from "@/lib/orders/courier";

export const dynamic = "force-dynamic";

const statusLabel = (s: string) => (STATUS_LABEL as Record<string, string>)[s] ?? s;

export default async function OrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; email?: string }>;
}) {
  const { orderNumber, email } = await searchParams;

  const result =
    orderNumber && email
      ? await getGuestOrder(orderNumber.trim(), email.trim().toLowerCase())
      : null;

  const notFound = orderNumber && email && result === null;

  return (
    <section className="mx-auto max-w-xl px-6 py-14">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">주문 조회</h1>
      <p className="mt-1 text-sm text-stone-500">
        비회원 주문 번호와 주문 시 입력한 이메일로 조회할 수 있습니다.
      </p>

      {/* Search form — submits via GET */}
      <form method="GET" className="mt-6 space-y-4">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-semibold text-wsb-carbon">
            주문 번호
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            type="text"
            defaultValue={orderNumber ?? ""}
            placeholder="WSB-20240101-XXXX"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-wsb-green focus:ring-1 focus:ring-wsb-green"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-wsb-carbon">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="order@example.com"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-wsb-green focus:ring-1 focus:ring-wsb-green"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-wsb-green px-4 py-3 text-sm font-bold text-white transition hover:bg-wsb-green/90"
        >
          조회하기
        </button>
      </form>

      {/* Error: not found */}
      {notFound && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          조회되지 않습니다. 주문 번호와 이메일을 다시 확인해 주세요.
        </p>
      )}

      {/* Success: show order summary */}
      {result && (
        <div className="mt-8 space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-lg font-extrabold text-wsb-carbon">
              {result.order.orderNumber}
            </h2>
            <span className="rounded-full bg-wsb-green/10 px-2.5 py-0.5 text-xs font-semibold text-wsb-green">
              {statusLabel(result.order.status)}
            </span>
          </div>

          {/* Tracking */}
          {result.order.trackingNumber && (() => {
            const url = trackingUrl(result.order.courier, result.order.trackingNumber);
            return (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
                <p className="font-semibold text-wsb-carbon">배송 정보</p>
                <div className="mt-2 flex justify-between text-stone-600">
                  <span>택배사</span>
                  <span>{result.order.courier ?? "-"}</span>
                </div>
                <div className="mt-1 flex justify-between text-stone-600">
                  <span>송장번호</span>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-wsb-green underline underline-offset-2"
                    >
                      {result.order.trackingNumber}
                    </a>
                  ) : (
                    <span className="font-mono">{result.order.trackingNumber}</span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Items */}
          <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200">
            {result.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-4 text-sm">
                <span>
                  {item.productName}{" "}
                  <span className="text-stone-400">/ {item.variantName}</span> ×{" "}
                  {item.quantity}
                </span>
                <span className="font-mono font-bold">{formatKRW(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">상품 합계</dt>
              <dd className="font-mono">{formatKRW(result.order.itemsSubtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">배송비</dt>
              <dd className="font-mono">{formatKRW(result.order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-1 font-extrabold">
              <dt>총 결제금액</dt>
              <dd className="font-mono">{formatKRW(result.order.totalAmount)}</dd>
            </div>
          </dl>

          <div className="text-sm text-stone-600">
            <p>받는 분: {result.order.customerName} ({result.order.customerPhone})</p>
            <p>배송지: {result.order.shippingAddress}</p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-stone-400">
        회원이신가요?{" "}
        <Link href="/login" className="text-wsb-green underline underline-offset-2">
          로그인
        </Link>
        하시면 더 편리하게 주문 내역을 확인할 수 있습니다.
      </div>
    </section>
  );
}
