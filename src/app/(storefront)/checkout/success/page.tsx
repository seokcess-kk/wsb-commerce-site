import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import { getDb, schema } from "@/db/index";
import { listPublishedProducts } from "@/db/queries/products";
import { confirmTossPayment, type TossPayment } from "@/lib/payments/toss";
import { settlePaidOrder } from "@/lib/payments/settle";
import { bankName } from "@/lib/payments/banks";
import { NUTROGIN_SLUGS } from "@/lib/brand/copy";
import { formatKRW } from "@/lib/format";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { CTAButton } from "@/components/ui/cta-button";
import { RelatedProducts } from "@/components/catalog/related-products";

export const dynamic = "force-dynamic";

type OrderRow = typeof schema.orders.$inferSelect;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;
  if (!paymentKey || !orderId || !amount) {
    return <FailResult message="잘못된 접근입니다." />;
  }
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderId)).limit(1);
  if (!order) return <FailResult message="주문을 찾을 수 없습니다." />;
  if (Number(amount) !== order.totalAmount) {
    return <FailResult message="결제 금액이 일치하지 않습니다." />;
  }

  let virtualAccount: TossPayment["virtualAccount"] | null = null;
  let awaitingDeposit = false;

  if (order.status !== "paid") {
    try {
      const result = await confirmTossPayment({ paymentKey, orderId, amount: order.totalAmount });
      // 가상계좌: 승인 시점엔 미입금(WAITING_FOR_DEPOSIT) — 입금 대기만 기록, 정산은 웹훅이.
      if (result.status === "WAITING_FOR_DEPOSIT") {
        await db
          .insert(schema.payments)
          .values({
            orderId: order.id, provider: "toss", paymentKey: result.paymentKey,
            method: result.method ?? null, amount: result.totalAmount, status: result.status, approvedAt: null,
          })
          .onConflictDoNothing({ target: schema.payments.paymentKey });
        awaitingDeposit = true;
        virtualAccount = result.virtualAccount ?? null;
      } else {
        await settlePaidOrder(order, result);
      }
    } catch (e) {
      return <FailResult message={(e as Error).message} />;
    }
  }

  if (awaitingDeposit) {
    return <VirtualAccountResult order={order} va={virtualAccount} />;
  }

  // 완료 — 주문 상품 + NUTROGIN 교차판매 로드
  const [items, allProducts] = await Promise.all([
    db
      .select({
        productName: schema.orderItems.productName,
        variantName: schema.orderItems.variantName,
        quantity: schema.orderItems.quantity,
        lineTotal: schema.orderItems.lineTotal,
      })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id)),
    listPublishedProducts(),
  ]);
  const related = allProducts.filter((p) => NUTROGIN_SLUGS.includes(p.slug)).slice(0, 3);

  return <OrderComplete order={order} items={items} related={related} />;
}

function OrderComplete({
  order,
  items,
  related,
}: {
  order: OrderRow;
  items: { productName: string; variantName: string | null; quantity: number; lineTotal: number }[];
  related: Parameters<typeof RelatedProducts>[0]["products"];
}) {
  return (
    <div className="pb-12">
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <ClearCartOnMount />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ng-cobalt">
          <Check size={28} className="text-ng-neon" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-ng-charcoal">주문이 완료되었습니다</h1>
        <p className="mt-2 text-sm text-stone-500">결제가 정상 처리되었습니다. 예상 배송일은 영업일 기준 1~3일입니다.</p>

        <dl className="mt-6 space-y-2 rounded-2xl border border-stone-200 bg-ng-offwhite p-5 text-left text-sm">
          <Row label="주문번호" value={order.orderNumber} mono />
          <Row label="결제금액" value={formatKRW(order.totalAmount)} mono />
        </dl>

        {items.length > 0 && (
          <ul className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 text-left text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex justify-between gap-2 px-5 py-3">
                <span className="min-w-0 truncate text-stone-700">
                  {it.productName}
                  {it.variantName ? ` / ${it.variantName}` : ""}
                  <span className="ml-1 text-stone-400">×{it.quantity}</span>
                </span>
                <span className="shrink-0 font-mono font-semibold">{formatKRW(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <CTAButton href="/account" variant="primary" size="md">
            주문 내역 보기
          </CTAButton>
          <CTAButton href="/products" variant="outline" size="md">
            쇼핑 계속하기
          </CTAButton>
        </div>
      </section>

      {related.length > 0 && <RelatedProducts products={related} title="이런 제품도 함께" eyebrow="NEXT" />}
    </div>
  );
}

function VirtualAccountResult({ order, va }: { order: OrderRow; va: TossPayment["virtualAccount"] }) {
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      <ClearCartOnMount />
      <h1 className="text-2xl font-extrabold text-ng-charcoal">가상계좌가 발급되었습니다</h1>
      <p className="mt-3 text-sm text-stone-500">아래 계좌로 입금이 확인되면 주문이 자동으로 완료됩니다.</p>
      <dl className="mt-6 space-y-2 rounded-2xl border border-stone-200 bg-ng-offwhite p-5 text-left text-sm">
        <Row label="입금 은행" value={bankName(va?.bankCode)} />
        <Row label="계좌번호" value={va?.accountNumber ?? "-"} mono />
        <Row label="입금 금액" value={formatKRW(order.totalAmount)} mono />
        {va?.dueDate && <Row label="입금 기한" value={formatDueDate(va.dueDate)} />}
        <Row label="주문번호" value={order.orderNumber} mono />
      </dl>
      <p className="mt-4 text-xs text-stone-400">입금 기한 내에 입금해 주세요. 입금자명이 달라도 정상 처리됩니다.</p>
      <div className="mt-6">
        <CTAButton href="/account" variant="primary" size="md">
          주문 내역 보기
        </CTAButton>
      </div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-stone-500">{label}</dt>
      <dd className={`text-right font-semibold text-ng-charcoal ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function FailResult({ message }: { message: string }) {
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-ng-charcoal">결제에 실패했습니다</h1>
      <p className="mt-4 text-sm text-rose-600">{message}</p>
      <div className="mt-6">
        <CTAButton href="/cart" variant="primary" size="md">
          장바구니로 돌아가기
        </CTAButton>
      </div>
    </section>
  );
}
