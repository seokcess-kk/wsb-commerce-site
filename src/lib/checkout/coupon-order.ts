/**
 * Helpers for applying a coupon row to an order calculation.
 * These are pure functions — no DB access — and are unit-tested independently.
 */
import { couponDiscount, type CouponRule } from "@/lib/checkout/discount";
import { orderTotal } from "@/lib/checkout/pricing";

export type CouponRow = {
  discountType: string;
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type OrderFigures = {
  discount: number;
  total: number;
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

/**
 * Returns true when the coupon is applicable: active flag is set, the
 * current date falls within any configured window, and — when `subtotal`
 * is provided — the order subtotal meets the minimum purchase threshold.
 *
 * The optional `subtotal` parameter aligns this function with
 * `validateCoupon` (src/lib/coupons/validate.ts), which is the
 * **authoritative** validator for the server order path (called via
 * `getApplicableCoupon`). `computeOrderFigures` / `isCouponValid` are
 * used for UI-side preview; passing `subtotal` here makes both layers
 * agree on the minSubtotal check.
 */
export function isCouponValid(
  row: CouponRow,
  now: Date = new Date(),
  subtotal?: number,
): boolean {
  if (!row.isActive) return false;
  if (row.startsAt && now < row.startsAt) return false;
  if (row.endsAt && now > row.endsAt) return false;
  if (subtotal !== undefined && subtotal < row.minSubtotal) return false;
  return true;
}

/**
 * Compute final order figures (discount + total) given a subtotal and an
 * optional coupon row. If the row is null or invalid (active/date/minSubtotal
 * checks fail) the discount is 0.
 *
 * NOTE: For the server order path (POST /api/orders) `getApplicableCoupon`
 * is the authoritative validator — it additionally verifies user ownership
 * and unused status. `computeOrderFigures` is used for UI-side preview and
 * should not be used to trust a discount without `getApplicableCoupon` first.
 */
export function computeOrderFigures(
  subtotal: number,
  couponRow: CouponRow | null | undefined,
  now: Date = new Date(),
): OrderFigures {
  if (!couponRow || !isCouponValid(couponRow, now, subtotal)) {
    return { discount: 0, total: orderTotal(subtotal, 0) };
  }
  const rule = couponRowToRule(couponRow);
  const discount = couponDiscount(subtotal, rule);
  return { discount, total: orderTotal(subtotal, discount) };
}
