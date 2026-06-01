import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  userId: uuid("user_id"),
  customerName: varchar("customer_name", { length: 80 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingZipcode: varchar("shipping_zipcode", { length: 12 }),
  itemsSubtotal: integer("items_subtotal").notNull(),
  shippingFee: integer("shipping_fee").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
