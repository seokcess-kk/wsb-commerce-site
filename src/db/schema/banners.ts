import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 160 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
