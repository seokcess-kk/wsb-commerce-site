/**
 * Pure helper: renders the human-readable discount description for a coupon.
 * No DB access — no side effects.
 */

import { formatKRW } from "@/lib/format";

export type CouponLabelInput = {
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number;
};

/**
 * Returns a discount description string.
 * Examples:
 *   fixed 3000, min 0              → "3,000원 할인"
 *   percent 10, max 5000, min 30000 → "10% 할인 (최대 5,000원)"
 *   percent 15, no max              → "15% 할인"
 */
export function couponLabel(c: CouponLabelInput): string {
  if (c.discountType === "percent") {
    const base = `${c.discountValue}% 할인`;
    return c.maxDiscount ? `${base} (최대 ${formatKRW(c.maxDiscount)})` : base;
  }
  return `${formatKRW(c.discountValue)} 할인`;
}
