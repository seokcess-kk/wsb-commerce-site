import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  label: varchar("label", { length: 40 }),
  recipient: varchar("recipient", { length: 80 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  zipcode: varchar("zipcode", { length: 12 }).notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
