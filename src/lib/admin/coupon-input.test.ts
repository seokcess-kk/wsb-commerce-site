import { describe, it, expect } from "vitest";
import { validateCouponInput, normalizeCouponCode } from "./coupon-input";

const base = {
  code: "WELCOME10",
  name: "신규 가입 쿠폰",
  discountType: "rate",
  discountValue: 10,
  minSubtotal: 0,
  maxDiscount: null as number | null,
  startsAt: null as Date | null,
  endsAt: null as Date | null,
};

describe("normalizeCouponCode", () => {
  it("공백 제거 + 대문자화", () => {
    expect(normalizeCouponCode("  welcome10 ")).toBe("WELCOME10");
  });
});

describe("validateCouponInput", () => {
  it("정상 입력 → ok", () => {
    expect(validateCouponInput(base)).toEqual({ ok: true });
  });

  it("code 비어있으면 실패", () => {
    expect(validateCouponInput({ ...base, code: "  " }).ok).toBe(false);
  });

  it("code 형식 위반(공백/특수문자) 실패", () => {
    expect(validateCouponInput({ ...base, code: "WEL COME" }).ok).toBe(false);
    expect(validateCouponInput({ ...base, code: "WEL@ME" }).ok).toBe(false);
  });

  it("name 비어있으면 실패", () => {
    expect(validateCouponInput({ ...base, name: " " }).ok).toBe(false);
  });

  it("discountType 은 amount/rate 만 허용", () => {
    expect(validateCouponInput({ ...base, discountType: "percent" }).ok).toBe(false);
  });

  it("rate 는 1~100", () => {
    expect(validateCouponInput({ ...base, discountType: "rate", discountValue: 0 }).ok).toBe(false);
    expect(validateCouponInput({ ...base, discountType: "rate", discountValue: 101 }).ok).toBe(false);
    expect(validateCouponInput({ ...base, discountType: "rate", discountValue: 50 }).ok).toBe(true);
  });

  it("amount 는 0 초과", () => {
    expect(validateCouponInput({ ...base, discountType: "amount", discountValue: 0 }).ok).toBe(false);
    expect(validateCouponInput({ ...base, discountType: "amount", discountValue: 3000 }).ok).toBe(true);
  });

  it("minSubtotal 음수면 실패", () => {
    expect(validateCouponInput({ ...base, minSubtotal: -1 }).ok).toBe(false);
  });

  it("maxDiscount 가 있으면 0 초과여야", () => {
    expect(validateCouponInput({ ...base, maxDiscount: 0 }).ok).toBe(false);
    expect(validateCouponInput({ ...base, maxDiscount: 5000 }).ok).toBe(true);
  });

  it("기간이 둘 다 있으면 startsAt ≤ endsAt", () => {
    const start = new Date("2026-06-10T00:00:00Z");
    const end = new Date("2026-06-01T00:00:00Z");
    expect(validateCouponInput({ ...base, startsAt: start, endsAt: end }).ok).toBe(false);
    expect(validateCouponInput({ ...base, startsAt: end, endsAt: start }).ok).toBe(true);
  });
});
