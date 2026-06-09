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
 * Returns true when the coupon is applicable: active flag is set and
 * the current date falls within any configured window.
 */
export function isCouponValid(row: CouponRow, now: Date = new Date()): boolean {
  if (!row.isActive) return false;
  if (row.startsAt && now < row.startsAt) return false;
  if (row.endsAt && now > row.endsAt) return false;
  return true;
}

/**
 * Compute final order figures (discount + total) given a subtotal and an
 * optional coupon row. If the row is null/invalid the discount is 0.
 */
export function computeOrderFigures(
  subtotal: number,
  couponRow: CouponRow | null | undefined,
  now: Date = new Date(),
): OrderFigures {
  if (!couponRow || !isCouponValid(couponRow, now)) {
    return { discount: 0, total: orderTotal(subtotal, 0) };
  }
  const rule = couponRowToRule(couponRow);
  const discount = couponDiscount(subtotal, rule);
  return { discount, total: orderTotal(subtotal, discount) };
}
