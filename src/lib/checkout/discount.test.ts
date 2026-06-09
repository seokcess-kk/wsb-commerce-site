import { describe, it, expect } from "vitest";
import { couponDiscount, type CouponRule } from "./discount";

const fixed: CouponRule = { discountType: "fixed", discountValue: 3000, minSubtotal: 0, maxDiscount: null };
const pct: CouponRule = { discountType: "percent", discountValue: 10, minSubtotal: 30000, maxDiscount: 5000 };

describe("couponDiscount", () => {
  it("정액 할인은 고정 금액", () => expect(couponDiscount(20000, fixed)).toBe(3000));
  it("최소주문 미달이면 0", () => expect(couponDiscount(20000, pct)).toBe(0));
  it("정률 할인 + 상한 적용", () => expect(couponDiscount(80000, pct)).toBe(5000));
  it("정률 할인 상한 이하", () => expect(couponDiscount(40000, pct)).toBe(4000));
  it("할인은 소계를 넘지 않음", () => expect(couponDiscount(2000, fixed)).toBe(2000));
});
