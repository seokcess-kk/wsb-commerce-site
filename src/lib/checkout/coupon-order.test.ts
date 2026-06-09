import { describe, it, expect } from "vitest";
import {
  couponRowToRule,
  type CouponRow,
} from "./coupon-order";

const baseRow: CouponRow = {
  discountType: "fixed",
  discountValue: 3000,
  minSubtotal: 0,
  maxDiscount: null,
  startsAt: null,
  endsAt: null,
  isActive: true,
};

// ── couponRowToRule ───────────────────────────────────────────────────────────

describe("couponRowToRule", () => {
  it("fixed 타입 정확히 매핑", () => {
    const rule = couponRowToRule(baseRow);
    expect(rule.discountType).toBe("fixed");
    expect(rule.discountValue).toBe(3000);
    expect(rule.minSubtotal).toBe(0);
    expect(rule.maxDiscount).toBeNull();
  });

  it("percent 타입 정확히 매핑", () => {
    const row: CouponRow = { ...baseRow, discountType: "percent", discountValue: 10, maxDiscount: 5000 };
    const rule = couponRowToRule(row);
    expect(rule.discountType).toBe("percent");
    expect(rule.maxDiscount).toBe(5000);
  });

  it("알 수 없는 discountType은 fixed로 fallback", () => {
    const row: CouponRow = { ...baseRow, discountType: "unknown_type" };
    const rule = couponRowToRule(row);
    expect(rule.discountType).toBe("fixed");
  });
});
