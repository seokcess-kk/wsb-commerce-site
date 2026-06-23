"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isValidTransition, isCancellableByAdmin } from "@/lib/admin/order-status";
import { cancelTossPayment } from "@/lib/payments/toss-cancel";
import { CATALOG_TAG } from "@/db/queries/products";

export async function updateOrderStatus(orderNumber: string, to: string) {
  await requireAdmin();
  // 취소는 환불·재고 원복이 동반돼야 하므로 일반 상태 변경으로 막는다(cancelOrderAsAdmin 사용).
  if (to === "cancelled")
    throw new Error("취소는 환불 처리가 포함된 '주문 취소(환불)' 기능을 사용하세요.");
  const db = getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  if (!isValidTransition(order.status, to))
    throw new Error(`허용되지 않는 상태 변경: ${order.status} → ${to}`);
  await db.update(schema.orders).set({ status: to }).where(eq(schema.orders.id, order.id));
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
}

// 운영자 직접 주문 취소 — 토스 환불 + 재고 원복 + 상태 전이(멱등).
// 취소/반품 요청 승인(approveCancellation)과 동일한 안전 규약을 따른다:
//   1) 토스 cancelPayment 가 성공한 뒤에만 DB 트랜잭션을 연다(환불 실패 시 DB 불변).
//   2) orders.status 를 cancelled 가 아닐 때만 전이하는 조건부 UPDATE 로 멱등성 보장 — 재고 원복 1회.
// 토스는 이미 취소된 결제의 재취소를 거부하므로 재시도해도 이중 환불은 발생하지 않는다.
export async function cancelOrderAsAdmin(
  orderNumber: string,
  reason: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return { error: "주문을 찾을 수 없습니다." };
  if (order.status === "cancelled") {
    revalidatePath(`/admin/orders/${orderNumber}`);
    revalidatePath("/admin/orders");
    return {}; // 이미 취소됨 — 멱등 no-op.
  }
  if (!isCancellableByAdmin(order.status))
    return { error: `취소할 수 없는 상태입니다: ${order.status}` };

  const [payment] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, order.id))
    .limit(1);
  if (!payment) return { error: "결제 정보를 찾을 수 없습니다. 수동 환불이 필요합니다." };

  // 1) 토스 환불(성공해야만 DB 변경)
  try {
    await cancelTossPayment(payment.paymentKey, { cancelReason: reason.trim() || "관리자 직접 취소" });
  } catch (e) {
    return { error: (e as Error).message };
  }

  // 2) 멱등 트랜잭션: 상태 전이 + 재고 원복 + 결제 상태
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.orders)
      .set({ status: "cancelled" })
      .where(and(eq(schema.orders.id, order.id), ne(schema.orders.status, "cancelled")))
      .returning({ id: schema.orders.id });

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
      await tx.update(schema.payments).set({ status: "cancelled" }).where(eq(schema.payments.id, payment.id));
    }
  });

  // 재고 원복이 PDP 캐시(getProductBySlug)에 즉시 반영되도록 카탈로그 태그 무효화.
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
  return {};
}

export async function updateShipping(formData: FormData) {
  await requireAdmin();
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const courier = String(formData.get("courier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  if (!orderNumber) throw new Error("orderNumber 누락");
  const db = getDb();
  await db
    .update(schema.orders)
    .set({ courier: courier || null, trackingNumber: trackingNumber || null })
    .where(eq(schema.orders.orderNumber, orderNumber));
  revalidatePath(`/admin/orders/${orderNumber}`);
}
