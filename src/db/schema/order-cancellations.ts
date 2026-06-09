import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const orderCancellations = pgTable("order_cancellations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 12 }).notNull().default("requested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
