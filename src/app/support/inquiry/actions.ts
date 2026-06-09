"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createInquiry } from "@/db/queries/inquiries";

const CATEGORIES = ["배송", "주문", "상품", "기타"] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitInquiry(
  formData: FormData,
): Promise<{ error?: string }> {
  const category = (formData.get("category") as string | null)?.trim() ?? "";
  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const body = (formData.get("body") as string | null)?.trim() ?? "";
  const emailInput = (formData.get("email") as string | null)?.trim() ?? "";

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "문의 유형을 선택해 주세요." };
  }
  if (!subject || subject.length < 2) {
    return { error: "제목을 2자 이상 입력해 주세요." };
  }
  if (!body || body.length < 5) {
    return { error: "문의 내용을 5자 이상 입력해 주세요." };
  }

  const user = await getCurrentUser();

  let userId: string | null = null;
  let email: string;

  if (user) {
    userId = user.id;
    email = user.email ?? emailInput;
  } else {
    if (!emailInput || !isValidEmail(emailInput)) {
      return { error: "유효한 이메일을 입력해 주세요." };
    }
    email = emailInput;
  }

  await createInquiry({ userId, email, category, subject, body });

  if (user) {
    redirect("/account/inquiries");
  } else {
    redirect("/support/inquiry/complete");
  }
}
