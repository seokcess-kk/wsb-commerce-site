import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export async function listAllOrders() {
  return getDb().select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(200);
}

export async function getOrderAdmin(orderNumber: string) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}
