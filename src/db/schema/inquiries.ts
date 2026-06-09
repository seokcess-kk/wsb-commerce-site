import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  email: varchar("email", { length: 200 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 12 }).notNull().default("open"),
  answer: text("answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
