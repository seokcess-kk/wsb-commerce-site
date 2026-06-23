"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { canProcessCancellation } from "@/lib/orders/cancellation";
import { cancelTossPayment } from "@/lib/payments/toss-cancel";
import { CATALOG_TAG } from "@/db/queries/products";

function revalidate() {
  revalidatePath("/admin/orders/cancellations");
  revalidatePath("/admin/orders");
  // 재고 원복이 PDP 캐시(getProductBySlug)에 즉시 반영되도록 카탈로그 태그 무효화.
  revalidateTag(CATALOG_TAG, "max");
}

// 취소/반품 요청 승인 → 토스 환불 + 재고 원복 + 상태 전이(멱등).
//
// 멱등성: cancellation 의 `requested → refunded` 전이를 조건부 UPDATE(`where status='requested'`)로
// 보호한다. 두 번째 호출은 0행이 갱신되어 환불·재고복원이 실행되지 않는다 — 이중 환불 방지.
//
// 실패 경계: 토스 cancelPayment 가 성공한 뒤에만 DB 트랜잭션을 연다. 토스 호출이 실패하면
// DB는 변경되지 않고 에러가 호출자(페이지)로 전파된다. 토스는 이미 취소된 결제의 재취소를
// 거부하므로, 운영자가 재시도해도 이중 환불은 발생하지 않는다.
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
    // 이미 처리된(환불완료/반려) 요청 — 멱등 no-op.
    return {};
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, cancellation.orderId))
    .limit(1);
  if (!order) return { error: "주문을 찾을 수 없습니다." };

  const [payment] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, order.id))
    .limit(1);
  if (!payment) return { error: "결제 정보를 찾을 수 없습니다. 수동 환불이 필요합니다." };

  // 1) 토스 환불 (성공해야만 DB 변경)
  try {
    await cancelTossPayment(payment.paymentKey, { cancelReason: cancellation.reason });
  } catch (e) {
    return { error: (e as Error).message };
  }

  // 2) 멱등 트랜잭션: 상태 전이 + 재고 원복 + 결제/주문 상태
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.orderCancellations)
      .set({ status: "refunded" })
      .where(
        and(
          eq(schema.orderCancellations.id, id),
          eq(schema.orderCancellations.status, "requested"),
        ),
      )
      .returning({ id: schema.orderCancellations.id });

    // 조건부 전이가 1회만 성공 — 재고 원복도 정확히 1회.
    if (updated.length > 0) {
      const items = await tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));
      for (const it of items) {
        await tx
          .update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} + ${it.quantity}` })
          .where(eq(schema.productVariants.id, it.variantId));
      }
      await tx.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, order.id));
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
