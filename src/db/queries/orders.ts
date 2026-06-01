import { and, eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type OrderSummaryRow = typeof schema.orders.$inferSelect;
export type OrderItemRow = typeof schema.orderItems.$inferSelect;

export async function listOrdersByUser(userId: string): Promise<OrderSummaryRow[]> {
  const db = getDb();
  return db.select().from(schema.orders)
    .where(eq(schema.orders.userId, userId))
    .orderBy(desc(schema.orders.createdAt));
}

export async function getOrderDetailForUser(
  userId: string, orderNumber: string,
): Promise<{ order: OrderSummaryRow; items: OrderItemRow[] } | null> {
  const db = getDb();
  const [order] = await db.select().from(schema.orders)
    .where(and(eq(schema.orders.orderNumber, orderNumber), eq(schema.orders.userId, userId)))
    .limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}
