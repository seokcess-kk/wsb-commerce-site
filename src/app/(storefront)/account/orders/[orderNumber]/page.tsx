import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOrderDetailForUser, getReorderItems } from "@/db/queries/orders";
import { getDb, schema } from "@/db/index";
import { eq } from "drizzle-orm";
import { formatKRW } from "@/lib/format";
import { statusLabel } from "@/lib/admin/order-status";
import { availableRequestTypes, REQUEST_TYPE_LABEL } from "@/lib/orders/cancellation";
import { trackingUrl } from "@/lib/orders/courier";
import { bankName } from "@/lib/payments/banks";
import { ReorderButton } from "@/components/account/reorder-button";
import { CancellationRequestForm } from "@/components/account/cancellation-request-form";
import { requestCancellation } from "./actions";

export const dynamic = "force-dynamic";

const CANCELLATION_STATUS_LABEL: Record<string, string> = {
  requested: "접수",
  approved: "승인",
  rejected: "거절",
  completed: "완료",
  refunded: "환불 완료",
  resolved: "처리완료",
};

function formatDueDate(d: Date): string {
  return d.toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/account/orders/${orderNumber}`);

  const detail = await getOrderDetailForUser(user.id, orderNumber);
  if (!detail) notFound();
  const { order, items } = detail;

  // Fetch existing cancellation requests
  const db = getDb();
  const cancellations = await db
    .select()
    .from(schema.orderCancellations)
    .where(eq(schema.orderCancellations.orderId, order.id));

  // 가상계좌 입금 대기 정보 — 미입금 상태면 계좌번호/은행/기한을 재노출한다.
  const [payment] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, order.id))
    .limit(1);
  const awaitingDeposit =
    order.status === "pending" &&
    payment?.status === "WAITING_FOR_DEPOSIT" &&
    !!payment.vaAccountNumber;

  // Fetch reorder items (server-side for the client island)
  const reorderItems = await getReorderItems(user.id, orderNumber) ?? [];

  const allowedTypes = availableRequestTypes(order.status);
  const trackingLink = trackingUrl(order.courier, order.trackingNumber);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/account" className="text-sm text-ng-cobalt">← 마이페이지</Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-mono text-xl font-extrabold text-ng-charcoal">{order.orderNumber}</h1>
        <span className="rounded-full bg-ng-cobalt/10 px-2.5 py-0.5 text-xs font-semibold text-ng-cobalt">{statusLabel(order.status)}</span>
        <div className="ml-auto">
          <ReorderButton items={reorderItems} />
        </div>
      </div>

      {/* 가상계좌 입금 대기 안내 */}
      {awaitingDeposit && payment && (
        <div className="mt-5 rounded-lg border border-ng-cobalt/30 bg-ng-cobalt/5 p-4 text-sm">
          <p className="font-semibold text-ng-charcoal">가상계좌 입금 대기</p>
          <p className="mt-1 text-stone-600">아래 계좌로 입금이 확인되면 주문이 자동으로 완료됩니다.</p>
          <dl className="mt-3 space-y-1.5">
            <div className="flex justify-between"><dt className="text-stone-500">입금 은행</dt><dd className="font-semibold text-ng-charcoal">{bankName(payment.vaBankCode)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">계좌번호</dt><dd className="font-mono font-semibold text-ng-charcoal">{payment.vaAccountNumber}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">입금 금액</dt><dd className="font-mono font-semibold text-ng-charcoal">{formatKRW(order.totalAmount)}</dd></div>
            {payment.vaDueDate && (
              <div className="flex justify-between"><dt className="text-stone-500">입금 기한</dt><dd className="font-semibold text-ng-charcoal">{formatDueDate(payment.vaDueDate)}</dd></div>
            )}
          </dl>
          <p className="mt-3 text-xs text-stone-400">입금 기한 내에 입금해 주세요. 입금자명이 달라도 정상 처리됩니다.</p>
        </div>
      )}

      {/* Tracking block */}
      {order.trackingNumber ? (
        <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
          <p className="font-semibold text-ng-charcoal">배송 정보</p>
          <div className="mt-2 flex justify-between text-stone-600">
            <span>택배사</span><span>{order.courier ?? "-"}</span>
          </div>
          <div className="mt-1 flex justify-between text-stone-600">
            <span>송장번호</span>
            {trackingLink ? (
              <a
                href={trackingLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${order.trackingNumber} (새 탭에서 열림)`}
                className="font-mono text-ng-cobalt underline underline-offset-2"
              >
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-mono">{order.trackingNumber}</span>
            )}
          </div>
        </div>
      ) : order.status === "preparing" ? (
        <p className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">상품을 준비 중입니다. 발송되면 송장번호가 등록됩니다.</p>
      ) : null}

      {/* Order items */}
      <ul className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between p-4 text-sm">
            <span>{it.productName} <span className="text-stone-400">/ {it.variantName}</span> × {it.quantity}</span>
            <span className="font-mono font-bold">{formatKRW(it.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-stone-500">상품 합계</dt><dd className="font-mono">{formatKRW(order.itemsSubtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-500">배송비</dt><dd className="font-mono">{formatKRW(order.shippingFee)}</dd></div>
        <div className="flex justify-between border-t border-stone-200 pt-1 font-extrabold"><dt>총 결제금액</dt><dd className="font-mono">{formatKRW(order.totalAmount)}</dd></div>
      </dl>

      {/* Shipping address */}
      <div className="mt-4 text-sm text-stone-600">
        <p>받는 분: {order.customerName} ({order.customerPhone})</p>
        <p>배송지: {order.shippingAddress}</p>
      </div>

      {/* Existing cancellation requests */}
      {cancellations.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-ng-charcoal">요청 내역</h2>
          <ul className="mt-3 space-y-2">
            {cancellations.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-stone-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ng-charcoal">
                    {REQUEST_TYPE_LABEL[c.type as keyof typeof REQUEST_TYPE_LABEL] ?? c.type}
                  </span>
                  <span className="text-xs text-stone-500">
                    {CANCELLATION_STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <p className="mt-1 text-stone-600">{c.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cancellation/exchange/return request form */}
      {allowedTypes.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-ng-charcoal">
            {allowedTypes.includes("cancel") ? "취소 신청" : "교환/반품 신청"}
          </h2>
          <CancellationRequestForm
            orderNumber={orderNumber}
            allowedTypes={allowedTypes}
            action={requestCancellation}
          />
        </div>
      )}
    </section>
  );
}
