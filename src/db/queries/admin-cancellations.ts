import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

// 처리 대기(requested) 취소/반품 요청 수 — 대시보드 미처리 카드용.
export async function countRequestedCancellations(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.orderCancellations)
    .where(eq(schema.orderCancellations.status, "requested"));
  return row?.c ?? 0;
}

// 취소/반품 요청 목록 (주문 정보 조인). statusFilter 가 주어지면 해당 상태만.
export async function listCancellations(statusFilter?: string) {
  const db = getDb();
  const base = db
    .select({
      id: schema.orderCancellations.id,
      type: schema.orderCancellations.type,
      reason: schema.orderCancellations.reason,
      status: schema.orderCancellations.status,
      createdAt: schema.orderCancellations.createdAt,
      orderNumber: schema.orders.orderNumber,
      orderStatus: schema.orders.status,
      totalAmount: schema.orders.totalAmount,
      customerName: schema.orders.customerName,
    })
    .from(schema.orderCancellations)
    .innerJoin(schema.orders, eq(schema.orderCancellations.orderId, schema.orders.id))
    .orderBy(desc(schema.orderCancellations.createdAt));

  if (statusFilter) {
    return base.where(eq(schema.orderCancellations.status, statusFilter));
  }
  return base;
}

// 단건 + 주문 + 항목.
export async function getCancellation(id: string) {
  const db = getDb();
  const [cancellation] = await db
    .select()
    .from(schema.orderCancellations)
    .where(eq(schema.orderCancellations.id, id))
    .limit(1);
  if (!cancellation) return null;
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, cancellation.orderId))
    .limit(1);
  const items = order
    ? await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id))
    : [];
  return { cancellation, order: order ?? null, items };
}
