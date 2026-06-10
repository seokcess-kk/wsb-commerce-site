"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { claimCoupon } from "@/db/queries/coupons";

export type ClaimCouponActionResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function claimCouponAction(
  code: string,
): Promise<ClaimCouponActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/coupons");

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { ok: false, reason: "쿠폰 코드를 입력해 주세요." };
  }

  const result = await claimCoupon(user.id, trimmed);
  if (result.ok) {
    revalidatePath("/account/coupons");
  }
  return result;
}
