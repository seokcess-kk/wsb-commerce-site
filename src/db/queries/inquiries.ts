import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type InquiryRow = {
  id: string;
  userId: string | null;
  email: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  answer: string | null;
  createdAt: Date;
};

export type CreateInquiryInput = {
  userId?: string | null;
  email: string;
  category: string;
  subject: string;
  body: string;
};

export async function createInquiry(input: CreateInquiryInput): Promise<InquiryRow> {
  const db = getDb();
  const [row] = await db
    .insert(schema.inquiries)
    .values({
      userId: input.userId ?? null,
      email: input.email,
      category: input.category,
      subject: input.subject,
      body: input.body,
      // status defaults to 'open' via schema default
    })
    .returning();
  return row;
}

export async function listInquiriesByUser(userId: string): Promise<InquiryRow[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.inquiries)
    .where(eq(schema.inquiries.userId, userId))
    .orderBy(desc(schema.inquiries.createdAt));
}

export async function getInquiryForUser(
  userId: string,
  id: string,
): Promise<InquiryRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.inquiries)
    .where(and(eq(schema.inquiries.userId, userId), eq(schema.inquiries.id, id)))
    .limit(1);
  return row ?? null;
}
