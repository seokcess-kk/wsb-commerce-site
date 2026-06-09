import { eq, desc, and, or, ilike, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type OrderListParams = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

// 주문 목록: 상태 필터 + 검색(주문번호/주문자) + 페이지네이션. total 도 반환.
export async function listAllOrders(params: OrderListParams = {}) {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;

  const conds: SQL[] = [];
  if (params.status) conds.push(eq(schema.orders.status, params.status));
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    const search = or(
      ilike(schema.orders.orderNumber, term),
      ilike(schema.orders.customerName, term),
    );
    if (search) conds.push(search);
  }
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select()
    .from(schema.orders)
    .where(where)
    .orderBy(desc(schema.orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [countRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(where);

  return { rows, total: countRow?.c ?? 0, page, pageSize };
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
