import { describe, it, expect } from "vitest";
import { shippingFee, orderTotal, FREE_SHIPPING_THRESHOLD, BASE_SHIPPING_FEE } from "./pricing";

describe("pricing", () => {
  it("5만원 미만은 기본 배송비", () => {
    expect(shippingFee(49000)).toBe(BASE_SHIPPING_FEE);
  });
  it("5만원 이상은 무료배송", () => {
    expect(shippingFee(FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(shippingFee(80000)).toBe(0);
  });
  it("소계 0이면 배송비도 0", () => {
    expect(shippingFee(0)).toBe(0);
  });
  it("주문 총액 = 소계 + 배송비", () => {
    expect(orderTotal(49000)).toBe(49000 + BASE_SHIPPING_FEE);
    expect(orderTotal(50000)).toBe(50000);
  });
});
