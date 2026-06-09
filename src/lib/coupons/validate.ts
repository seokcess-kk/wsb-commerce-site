/**
 * Pure coupon validation — no DB access.
 * Inject `now` for deterministic testing.
 */

export type ValidatableCoupon = {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateCoupon(
  coupon: ValidatableCoupon,
  now: Date,
  subtotal: number,
): ValidationResult {
  if (!coupon.isActive) {
    return { ok: false, reason: "사용할 수 없는 쿠폰입니다." };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, reason: "아직 사용 기간이 아닙니다." };
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { ok: false, reason: "사용 기간이 만료되었습니다." };
  }
  if (subtotal < coupon.minSubtotal) {
    return { ok: false, reason: "최소 주문금액 미달입니다." };
  }
  return { ok: true };
}
