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
  reportNo: varchar("report_no", { length: 80 }),          // 품목보고번호
  functionality: text("functionality"),                     // 기능성 내용(심의 문구)
  intakeNotice: text("intake_notice"),                      // 섭취 시 주의사항
  ingredients: text("ingredients"),                         // 원료명 및 함량
  images: jsonb("images").$type<string[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  // 소프트 삭제(보관): 값이 있으면 '삭제됨'. 공개 쿼리는 isPublished 로 이미 숨겨지고,
  // 어드민 목록은 deletedAt IS NULL 로 필터한다. 주문 이력(order_items 스냅샷)은 보존된다.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
