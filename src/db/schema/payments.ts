import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 40 }).notNull().default("toss"),
  paymentKey: varchar("payment_key", { length: 200 }).notNull(),
  method: varchar("method", { length: 40 }),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
