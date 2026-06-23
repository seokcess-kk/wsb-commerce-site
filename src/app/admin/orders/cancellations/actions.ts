"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { canProcessCancellation, resolveCancellation } from "@/lib/orders/cancellation";
import { cancelTossPayment } from "@/lib/payments/toss-cancel";
import { CATALOG_TAG } from "@/db/queries/products";

function revalidate() {
  revalidatePath("/admin/orders/cancellations");
  revalidatePath("/admin/orders");
  // 재고 원복이 PDP 캐시(getProductBySlug)에 즉시 반영되도록 카탈로그 태그 무효화.
  revalidateTag(CATALOG_TAG, "max");
}

// 취소/교환/반품 요청 승인 → 요청 타입별 정책(resolveCancellation)에 따라 처리(멱등).
//
//   cancel  : 토스 전액환불 + 주문취소 + 재고원복(실제 차감된 수량만)
//   return  : 토스 전액환불 + 주문취소. 재고는 물품 회수·검수 후 운영자가 수동 입고(원복 X)
//   exchange: 환불 아님(동일상품 재발송). 주문 유지, 요청만 '처리완료(resolved)'로 마감
//
// 멱등성: cancellation 의 `requested → refunded|resolved` 전이를 조건부 UPDATE(`where status='requested'`)로
// 보호한다. 두 번째 호출은 0행이 갱신되어 환불·재고복원이 실행되지 않는다 — 이중 환불 방지.
//
// 실패 경계: (환불이 필요한 타입에 한해) 토스 cancelPayment 가 성공한 뒤에만 DB 트랜잭션을 연다.
// 토스 호출이 실패하면 DB는 변경되지 않고 에러가 호출자(페이지)로 전파된다. 토스는 이미 취소된
// 결제의 재취소를 거부하므로, 운영자가 재시도해도 이중 환불은 발생하지 않는다.
export async function approveCancellation(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();

  const [cancellation] = await db
    .select()
    .from(schema.orderCancellations)
    .where(eq(schema.orderCancellations.id, id))
    .limit(1);
  if (!cancellation) return { error: "요청을 찾을 수 없습니다." };
  if (!canProcessCancellation(cancellation.status)) {
    // 이미 처리된(환불완료/처리완료/반려) 요청 — 멱등 no-op.
    return {};
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, cancellation.orderId))
    .limit(1);
  if (!order) return { error: "주문을 찾을 수 없습니다." };

  const policy = resolveCancellation(cancellation.type);

  // 1) 환불이 필요한 타입(cancel/return)만 결제 정보 조회 + 토스 환불(성공해야 DB 변경).
  //    교환(exchange)은 환불하지 않으므로 결제 조회·토스 호출을 건너뛴다.
  let payment: typeof schema.payments.$inferSelect | undefined;
  if (policy.refund) {
    [payment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, order.id))
      .limit(1);
    if (!payment) return { error: "결제 정보를 찾을 수 없습니다. 수동 환불이 필요합니다." };

    try {
      await cancelTossPayment(payment.paymentKey, { cancelReason: cancellation.reason });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  // 2) 멱등 트랜잭션: 상태 전이 + (정책에 따라) 재고 원복 + 주문/결제 상태
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.orderCancellations)
      .set({ status: policy.nextStatus })
      .where(
        and(
          eq(schema.orderCancellations.id, id),
          eq(schema.orderCancellations.status, "requested"),
        ),
      )
      .returning({ id: schema.orderCancellations.id });

    // 조건부 전이가 1회만 성공 — 이하 처리도 정확히 1회.
    if (updated.length === 0) return;

    if (policy.restock) {
      // 실제 차감된(stockDeducted=true) 항목만 원복하고 플래그를 내려 재차 원복을 방지.
      // 차감 안 됐던(가드 미스) 수량을 더하지 않아 재고가 부풀려지지 않는다.
      const items = await tx
        .select()
        .from(schema.orderItems)
        .where(and(eq(schema.orderItems.orderId, order.id), eq(schema.orderItems.stockDeducted, true)));
      for (const it of items) {
        await tx
          .update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} + ${it.quantity}` })
          .where(eq(schema.productVariants.id, it.variantId));
      }
      if (items.length > 0) {
        await tx
          .update(schema.orderItems)
          .set({ stockDeducted: false })
          .where(and(eq(schema.orderItems.orderId, order.id), eq(schema.orderItems.stockDeducted, true)));
      }
    }

    if (policy.cancelOrder) {
      await tx.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, order.id));
    }

    if (policy.refund && payment) {
      await tx
        .update(schema.payments)
        .set({ status: "cancelled" })
        .where(eq(schema.payments.id, payment.id));
    }
  });

  revalidate();
  return {};
}

// 취소/반품 요청 반려.
export async function rejectCancellation(id: string, reason: string): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  const [cancellation] = await db
    .select()
    .from(schema.orderCancellations)
    .where(eq(schema.orderCancellations.id, id))
    .limit(1);
  if (!cancellation) return { error: "요청을 찾을 수 없습니다." };
  if (!canProcessCancellation(cancellation.status)) return {};

  await db
    .update(schema.orderCancellations)
    .set({ status: "rejected", reason: reason.trim() ? `${cancellation.reason}\n[반려 사유] ${reason.trim()}` : cancellation.reason })
    .where(
      and(eq(schema.orderCancellations.id, id), eq(schema.orderCancellations.status, "requested")),
    );
  revalidate();
  return {};
}
