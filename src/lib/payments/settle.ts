import { and, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { markCouponUsed } from "@/db/queries/coupons";
import type { TossPayment } from "@/lib/payments/toss";

type OrderRow = typeof schema.orders.$inferSelect;

export type DepositAction = "settle" | "ignore" | "amount_mismatch";

// 입금/승인 결과로부터 어떤 동작을 할지 결정하는 순수 함수(테스트 대상).
// - "DONE" 이 아니면 무시(입금 대기·취소 등은 정산하지 않음)
// - 금액이 주문과 다르면 정산하지 않고 운영자에게 알림
// - 그 외에는 정산(paid 전이 + 재고 차감)
export function decideDepositAction(paymentStatus: string, paidAmount: number, orderAmount: number): DepositAction {
  if (paymentStatus !== "DONE") return "ignore";
  if (paidAmount !== orderAmount) return "amount_mismatch";
  return "settle";
}

// 결제 확정 처리: payment 기록 upsert → pending→paid 조건부 전이 → 원자적 재고 차감 → 쿠폰 소진.
// 하나의 트랜잭션 + pending→paid 전이가 1회만 성공하는 멱등 가드로, 재고 차감·쿠폰 소진도 결제당 정확히 1회.
// 즉시 승인(카드/계좌이체/휴대폰)과 가상계좌 입금 웹훅이 공유한다.
export async function settlePaidOrder(order: OrderRow, payment: TossPayment): Promise<void> {
  const db = getDb();
  const approvedAt = payment.approvedAt ? new Date(payment.approvedAt) : null;

  await db.transaction(async (tx) => {
    // 가상계좌는 승인 시점에 WAITING_FOR_DEPOSIT 로 먼저 기록돼 있을 수 있으므로
    // paymentKey 충돌 시 status/approvedAt 을 최신(DONE)으로 갱신한다.
    await tx
      .insert(schema.payments)
      .values({
        orderId: order.id,
        provider: "toss",
        paymentKey: payment.paymentKey,
        method: payment.method ?? null,
        amount: payment.totalAmount,
        status: payment.status,
        approvedAt,
      })
      .onConflictDoUpdate({
        target: schema.payments.paymentKey,
        set: { status: payment.status, method: payment.method ?? null, approvedAt },
      });

    // pending → paid 전이는 단 한 번만 성공한다(멱등 가드).
    const updated = await tx
      .update(schema.orders)
      .set({ status: "paid" })
      .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending")))
      .returning({ id: schema.orders.id });

    if (updated.length > 0) {
      // 원자적 재고 차감: stock >= qty 조건으로 음수를 방지. 부족분은 차감하지 않고
      // 결제는 이미 승인됐으므로 운영자가 주문관리에서 처리한다.
      const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      for (const it of items) {
        // returning 으로 차감 성공 여부를 판정한다(가드 미매칭이면 0행).
        const deducted = await tx
          .update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} - ${it.quantity}` })
          .where(and(eq(schema.productVariants.id, it.variantId), gte(schema.productVariants.stock, it.quantity)))
          .returning({ id: schema.productVariants.id });

        if (deducted.length > 0) {
          // 실제 차감된 항목만 표시 — 취소 환불 시 이 수량만 원복(blind add 방지).
          await tx.update(schema.orderItems).set({ stockDeducted: true }).where(eq(schema.orderItems.id, it.id));
        } else {
          // 가드 미매칭(재고 부족) — 결제는 승인됐으나 차감 못 함(oversell 가능).
          // 운영자가 탐지·수동 처리할 수 있도록 로그를 남긴다.
          console.error(
            `[settle] 재고 부족으로 차감 실패 order=${order.orderNumber} variant=${it.variantId} qty=${it.quantity} (oversell 가능 — 운영자 확인 필요)`,
          );
        }
      }

      // 쿠폰 소진도 같은 멱등 블록 안에서 1회만 호출(markCouponUsed 는 usedAt IS NULL 가드라 재호출 안전).
      if (order.couponCode && order.userId) {
        await markCouponUsed(order.userId, order.couponCode, order.id, tx);
      }
    }
  });
}
