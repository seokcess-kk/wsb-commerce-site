import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { coupons } from "./coupons";

export const userCoupons = pgTable("user_coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  orderId: uuid("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueClaim: unique().on(t.couponId, t.userId) }));
