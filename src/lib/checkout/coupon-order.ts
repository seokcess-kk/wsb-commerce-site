/**
 * Helpers for applying a coupon row to an order calculation.
 * These are pure functions — no DB access — and are unit-tested independently.
 */
import { type CouponRule } from "@/lib/checkout/discount";

export type CouponRow = {
  discountType: string;
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

/**
 * Maps a database coupon row to the pure CouponRule type used by
 * couponDiscount(). The caller must already have verified the coupon
 * is active and within its date window; this function does NOT re-check
 * those fields — it is purely for mapping.
 */
export function couponRowToRule(row: CouponRow): CouponRule {
  return {
    discountType: (row.discountType === "percent" ? "percent" : "fixed") as
      | "fixed"
      | "percent",
    discountValue: row.discountValue,
    minSubtotal: row.minSubtotal,
    maxDiscount: row.maxDiscount,
  };
}
