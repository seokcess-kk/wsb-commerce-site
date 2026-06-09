import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

// 문의 목록. statusFilter('open'|'answered')가 주어지면 해당 상태만, 최신순.
export async function listInquiries(statusFilter?: string) {
  const db = getDb();
  const base = db.select().from(schema.inquiries).orderBy(desc(schema.inquiries.createdAt));
  if (statusFilter) {
    return base.where(eq(schema.inquiries.status, statusFilter));
  }
  return base;
}

export async function getInquiry(id: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.inquiries).where(eq(schema.inquiries.id, id)).limit(1);
  return row ?? null;
}

// 미답변(open) 문의 수 — 대시보드 미처리 카드용.
export async function countOpenInquiries(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.inquiries)
    .where(eq(schema.inquiries.status, "open"));
  return row?.c ?? 0;
}
