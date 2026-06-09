export type CouponRule = {
  discountType: "fixed" | "percent";
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
};

export function couponDiscount(subtotal: number, c: CouponRule): number {
  if (subtotal < c.minSubtotal) return 0;
  const raw =
    c.discountType === "percent"
      ? Math.floor((subtotal * c.discountValue) / 100)
      : c.discountValue;
  const capped = c.maxDiscount != null ? Math.min(raw, c.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}
