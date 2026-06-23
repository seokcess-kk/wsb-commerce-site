import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 40 }).notNull().default("toss"),
  paymentKey: varchar("payment_key", { length: 200 }).notNull().unique(),
  method: varchar("method", { length: 40 }),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  // 가상계좌 입금 정보. 입금 대기(WAITING_FOR_DEPOSIT) 시 영속화해
  // 고객이 success 페이지를 벗어나도 주문내역에서 계좌번호/기한을 재확인할 수 있게 한다.
  vaAccountNumber: varchar("va_account_number", { length: 40 }),
  vaBankCode: varchar("va_bank_code", { length: 10 }),
  vaCustomerName: varchar("va_customer_name", { length: 80 }),
  vaDueDate: timestamp("va_due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
