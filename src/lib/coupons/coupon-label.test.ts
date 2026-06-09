import { describe, it, expect } from "vitest";
import { couponLabel } from "./coupon-label";

describe("couponLabel", () => {
  it("fixed 할인: 금액 형식 반환", () => {
    expect(couponLabel({ discountType: "fixed", discountValue: 3000, maxDiscount: null, minSubtotal: 0 }))
      .toBe("₩3,000 할인");
  });

  it("percent 할인 + maxDiscount: 상한 포함 반환", () => {
    expect(couponLabel({ discountType: "percent", discountValue: 10, maxDiscount: 5000, minSubtotal: 30000 }))
      .toBe("10% 할인 (최대 ₩5,000)");
  });

  it("percent 할인 maxDiscount null: 상한 없이 반환", () => {
    expect(couponLabel({ discountType: "percent", discountValue: 15, maxDiscount: null, minSubtotal: 0 }))
      .toBe("15% 할인");
  });

  it("unknown discountType은 fixed처럼 처리 (방어적)", () => {
    expect(couponLabel({ discountType: "bonus", discountValue: 1000, maxDiscount: null, minSubtotal: 0 }))
      .toBe("₩1,000 할인");
  });
});
