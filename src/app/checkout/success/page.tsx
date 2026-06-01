import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { confirmTossPayment } from "@/lib/payments/toss";
import { formatKRW } from "@/lib/format";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;
  if (!paymentKey || !orderId || !amount) {
    return <Result ok={false} message="잘못된 접근입니다." />;
  }
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderId)).limit(1);
  if (!order) return <Result ok={false} message="주문을 찾을 수 없습니다." />;

  if (Number(amount) !== order.totalAmount) {
    return <Result ok={false} message="결제 금액이 일치하지 않습니다." />;
  }
  if (order.status === "paid") {
    return <Result ok orderNumber={order.orderNumber} amount={order.totalAmount} />;
  }

  try {
    const result = await confirmTossPayment({ paymentKey, orderId, amount: order.totalAmount });
    await db.insert(schema.payments).values({
      orderId: order.id, provider: "toss", paymentKey: result.paymentKey,
      method: result.method ?? null, amount: result.totalAmount, status: result.status,
      approvedAt: result.approvedAt ? new Date(result.approvedAt) : null,
    });
    await db.update(schema.orders).set({ status: "paid" }).where(eq(schema.orders.id, order.id));
  } catch (e) {
    return <Result ok={false} message={(e as Error).message} />;
  }
  return <Result ok orderNumber={order.orderNumber} amount={order.totalAmount} />;
}

function Result({ ok, orderNumber, amount, message }: { ok: boolean; orderNumber?: string; amount?: number; message?: string }) {
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      {ok && <ClearCartOnMount />}
      <h1 className="text-2xl font-extrabold text-wsb-carbon">{ok ? "주문이 완료되었습니다" : "결제에 실패했습니다"}</h1>
      {ok ? (
        <div className="mt-4 space-y-1 text-sm text-stone-600">
          <p>주문번호 <span className="font-mono">{orderNumber}</span></p>
          <p>결제금액 <span className="font-mono">{amount != null ? formatKRW(amount) : ""}</span></p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-rose-600">{message}</p>
      )}
      <Link href="/products" className="mt-6 inline-block rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white">쇼핑 계속하기</Link>
    </section>
  );
}
