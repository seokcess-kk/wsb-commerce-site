import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { products } from "./products";

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull().default("기본"),
  sku: varchar("sku", { length: 80 }),
  priceDelta: integer("price_delta").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
