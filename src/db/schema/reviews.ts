import { pgTable, uuid, varchar, integer, text, timestamp, jsonb, boolean, unique } from "drizzle-orm/pg-core";
import { products } from "./products";
import { orders } from "./orders";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 120 }),
  body: text("body").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  // 운영자 모더레이션: 숨긴 리뷰는 PDP 평점·목록에서 제외된다(삭제 없이 복원 가능).
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniquePerPurchase: unique().on(t.orderId, t.productId),
}));
