"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";

// 문의 답변 저장 + 상태 open→answered. (답변 이메일 발송은 비범위.)
export async function answerInquiry(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();
  if (!id || !answer) return;

  await getDb()
    .update(schema.inquiries)
    .set({ answer, status: "answered" })
    .where(eq(schema.inquiries.id, id));

  revalidatePath("/admin/inquiries");
}
