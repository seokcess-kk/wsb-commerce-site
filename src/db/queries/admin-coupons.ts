import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type CouponWithStats = typeof schema.coupons.$inferSelect & {
  issued: number;
  used: number;
};

// 쿠폰 목록 + 발급/사용 현황. issued = user_coupons 수, used = usedAt not null 수.
export async function listCouponsWithStats(): Promise<CouponWithStats[]> {
  const db = getDb();
  return db
    .select({
      id: schema.coupons.id,
      code: schema.coupons.code,
      name: schema.coupons.name,
      discountType: schema.coupons.discountType,
      discountValue: schema.coupons.discountValue,
      minSubtotal: schema.coupons.minSubtotal,
      maxDiscount: schema.coupons.maxDiscount,
      startsAt: schema.coupons.startsAt,
      endsAt: schema.coupons.endsAt,
      isActive: schema.coupons.isActive,
      createdAt: schema.coupons.createdAt,
      issued: sql<number>`count(${schema.userCoupons.id})::int`,
      used: sql<number>`count(${schema.userCoupons.usedAt})::int`,
    })
    .from(schema.coupons)
    .leftJoin(schema.userCoupons, eq(schema.userCoupons.couponId, schema.coupons.id))
    .groupBy(schema.coupons.id)
    .orderBy(desc(schema.coupons.createdAt));
}

export async function getCoupon(id: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.coupons).where(eq(schema.coupons.id, id)).limit(1);
  return row ?? null;
}

// 발급 이력 수(삭제 가능 여부 판정용).
export async function countCouponIssued(id: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.userCoupons)
    .where(eq(schema.userCoupons.couponId, id));
  return row?.c ?? 0;
}
