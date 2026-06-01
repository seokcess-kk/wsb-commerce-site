import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  brand: varchar("brand", { length: 80 }).notNull().default("WSB"),
  categoryId: uuid("category_id").references(() => categories.id),
  basePrice: integer("base_price").notNull(),
  summary: text("summary"),
  description: text("description"),
  reviewPhraseNo: varchar("review_phrase_no", { length: 80 }),
  noticeText: text("notice_text"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
