import { sql, eq, desc, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

const PAID_LIKE = ["paid", "preparing", "shipped", "delivered"];

export async function getStatusCounts(): Promise<Record<string, number>> {
  const db = getDb();
  const rows = await db.select({ status: schema.orders.status, c: sql<number>`count(*)::int` })
    .from(schema.orders).groupBy(schema.orders.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.c]));
}

export async function getDailyRevenue(days = 14): Promise<{ day: string; total: number }[]> {
  const db = getDb();
  const rows = await db.select({
    day: sql<string>`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`,
    total: sql<number>`coalesce(sum(${schema.orders.totalAmount}),0)::int`,
  }).from(schema.orders)
    .where(inArray(schema.orders.status, PAID_LIKE))
    .groupBy(sql`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(desc(sql`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`))
    .limit(days);
  return rows.reverse();
}

export async function getTopProducts(limit = 5): Promise<{ name: string; qty: number; revenue: number }[]> {
  const db = getDb();
  return db.select({
    name: schema.orderItems.productName,
    qty: sql<number>`sum(${schema.orderItems.quantity})::int`,
    revenue: sql<number>`sum(${schema.orderItems.lineTotal})::int`,
  }).from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .where(inArray(schema.orders.status, PAID_LIKE))
    .groupBy(schema.orderItems.productName)
    .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
    .limit(limit);
}

export async function getCustomerOrderCounts(): Promise<{ userId: string; orderCount: number }[]> {
  const db = getDb();
  const rows = await db.select({
    userId: schema.orders.userId,
    orderCount: sql<number>`count(*)::int`,
  }).from(schema.orders)
    .where(inArray(schema.orders.status, PAID_LIKE))
    .groupBy(schema.orders.userId);
  return rows.filter((r): r is { userId: string; orderCount: number } => r.userId !== null);
}
