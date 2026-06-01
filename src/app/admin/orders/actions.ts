"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isValidTransition } from "@/lib/admin/order-status";

export async function updateOrderStatus(orderNumber: string, to: string) {
  await requireAdmin();
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
