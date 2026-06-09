"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getApplicableCoupon, listUserCoupons } from "@/db/queries/coupons";
import type { ApplyCouponResult, UserCouponWithDetails } from "@/db/queries/coupons";

export type ApplyCouponActionResult = ApplyCouponResult;

/**
 * Server action: validate and apply a coupon code at checkout.
 * Uses server-authoritative pricing — never trusts client-sent discount amounts.
 */
export async function applyCouponAction(
  code: string,
  subtotal: number,
): Promise<ApplyCouponActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, reason: "로그인이 필요합니다." };
  }

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { ok: false, reason: "쿠폰 코드를 입력해 주세요." };
  }

  return getApplicableCoupon(user.id, trimmed, subtotal, new Date());
}

/**
 * Server action: list a logged-in user's available (unused, active) coupons.
 * Returns empty array when not logged in.
 */
export async function listAvailableCouponsAction(
  subtotal: number,
): Promise<UserCouponWithDetails[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const all = await listUserCoupons(user.id);
  const now = new Date();

  return all.filter((uc) => {
    if (uc.usedAt) return false;
    const c = uc.coupon;
    if (!c.isActive) return false;
    if (c.startsAt && now < c.startsAt) return false;
    if (c.endsAt && now > c.endsAt) return false;
    return true;
  });
}
