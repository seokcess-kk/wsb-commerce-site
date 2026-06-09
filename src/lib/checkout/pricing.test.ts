import { describe, it, expect } from "vitest";
import { shippingFee, orderTotal, freeShippingProgress, FREE_SHIPPING_THRESHOLD, BASE_SHIPPING_FEE } from "./pricing";

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

describe("orderTotal with discount", () => {
  it("할인 없을 때 기존과 동일", () => expect(orderTotal(20000)).toBe(23000));
  it("할인 후 5만원 미만이면 배송비 부과", () => expect(orderTotal(52000, 5000)).toBe(47000 + 3000));
  it("할인 후에도 5만원 이상이면 무료배송", () => expect(orderTotal(60000, 5000)).toBe(55000));
});

describe("freeShippingProgress", () => {
  it("빈 장바구니", () => expect(freeShippingProgress(0)).toEqual({ qualified: false, remaining: 50000 }));
  it("임박", () => expect(freeShippingProgress(45000)).toEqual({ qualified: false, remaining: 5000 }));
  it("달성", () => expect(freeShippingProgress(50000)).toEqual({ qualified: true, remaining: 0 }));
});
