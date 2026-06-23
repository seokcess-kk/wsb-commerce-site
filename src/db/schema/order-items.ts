import { pgTable, uuid, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull(),
  variantId: uuid("variant_id").notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  variantName: varchar("variant_name", { length: 160 }).notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
  // 결제 승인 시 이 항목의 재고가 실제로 차감됐는지(원자적 가드 통과 여부).
  // 취소 환불 시 '실제 차감된 수량'만 원복하기 위한 플래그 — blind add(가드 미차감분까지
  // 더해 재고가 부풀려지는 것)를 방지한다. settle 에서 차감 성공 시 true 로 전이.
  stockDeducted: boolean("stock_deducted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
