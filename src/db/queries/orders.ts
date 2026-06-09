import { and, eq, desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import type { ReorderItem } from "@/lib/cart/reorder";

export type OrderSummaryRow = typeof schema.orders.$inferSelect;
export type OrderItemRow = typeof schema.orderItems.$inferSelect;

export async function listOrdersByUser(
  userId: string,
  opts?: { status?: string },
): Promise<OrderSummaryRow[]> {
  const db = getDb();
  const conditions = [eq(schema.orders.userId, userId)];
  if (opts?.status) {
    conditions.push(eq(schema.orders.status, opts.status));
  }
  return db.select().from(schema.orders)
    .where(and(...conditions))
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

export async function getReorderItems(
  userId: string,
  orderNumber: string,
): Promise<ReorderItem[] | null> {
  const db = getDb();
  // Verify the order belongs to this user
  const [order] = await db.select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.orderNumber, orderNumber), eq(schema.orders.userId, userId)))
    .limit(1);
  if (!order) return null;

  const rows = await db
    .select({
      variantId: schema.orderItems.variantId,
      productSlug: schema.products.slug,
      productName: schema.orderItems.productName,
      variantName: schema.orderItems.variantName,
      unitPrice: schema.orderItems.unitPrice,
      quantity: schema.orderItems.quantity,
      thumbnail: sql<string | null>`(${schema.products.images}->>0)`,
    })
    .from(schema.orderItems)
    .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
    .innerJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
    .where(and(
      eq(schema.orderItems.orderId, order.id),
      eq(schema.products.isPublished, true),
    ));

  return rows;
}

export async function getGuestOrder(
  orderNumber: string,
  email: string,
): Promise<{ order: OrderSummaryRow; items: OrderItemRow[] } | null> {
  const db = getDb();
  const [order] = await db.select().from(schema.orders)
    .where(and(
      eq(schema.orders.orderNumber, orderNumber),
      sql`lower(${schema.orders.customerEmail}) = lower(${email})`,
    ))
    .limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}
