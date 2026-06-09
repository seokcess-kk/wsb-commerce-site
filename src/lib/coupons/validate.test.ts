import { describe, it, expect } from "vitest";
import { validateCoupon, type ValidatableCoupon } from "./validate";

const NOW = new Date("2026-06-09T12:00:00Z");
const YESTERDAY = new Date("2026-06-08T00:00:00Z");
const TOMORROW = new Date("2026-06-10T00:00:00Z");

const base: ValidatableCoupon = {
  isActive: true,
  startsAt: null,
  endsAt: null,
  minSubtotal: 0,
};

describe("validateCoupon", () => {
  it("active, 기간 없음, 최소주문 0 → ok", () => {
    expect(validateCoupon(base, NOW, 10000)).toEqual({ ok: true });
  });

  it("active, 기간 내, 최소주문 충족 → ok", () => {
    const c: ValidatableCoupon = { ...base, startsAt: YESTERDAY, endsAt: TOMORROW, minSubtotal: 5000 };
    expect(validateCoupon(c, NOW, 10000)).toEqual({ ok: true });
  });

  it("isActive false → 사용할 수 없는 쿠폰", () => {
    const result = validateCoupon({ ...base, isActive: false }, NOW, 10000);
    expect(result).toEqual({ ok: false, reason: "사용할 수 없는 쿠폰입니다." });
  });

  it("now < startsAt → 아직 사용 기간 아님", () => {
    const result = validateCoupon({ ...base, startsAt: TOMORROW }, NOW, 10000);
    expect(result).toEqual({ ok: false, reason: "아직 사용 기간이 아닙니다." });
  });

  it("now > endsAt → 사용 기간 만료", () => {
    const result = validateCoupon({ ...base, endsAt: YESTERDAY }, NOW, 10000);
    expect(result).toEqual({ ok: false, reason: "사용 기간이 만료되었습니다." });
  });

  it("subtotal < minSubtotal → 최소 주문금액 미달", () => {
    const result = validateCoupon({ ...base, minSubtotal: 30000 }, NOW, 20000);
    expect(result).toEqual({ ok: false, reason: "최소 주문금액 미달입니다." });
  });

  it("isActive 우선순위: inactive이면 다른 조건 무관하게 실패", () => {
    const c: ValidatableCoupon = { isActive: false, startsAt: YESTERDAY, endsAt: TOMORROW, minSubtotal: 0 };
    const result = validateCoupon(c, NOW, 50000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("사용할 수 없는 쿠폰입니다.");
  });
});
