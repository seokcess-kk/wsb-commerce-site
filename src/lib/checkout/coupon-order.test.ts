import { describe, it, expect } from "vitest";
import {
  couponRowToRule,
  isCouponValid,
  computeOrderFigures,
  type CouponRow,
} from "./coupon-order";
import { BASE_SHIPPING_FEE } from "./pricing";

const NOW = new Date("2026-06-09T12:00:00Z");
const YESTERDAY = new Date("2026-06-08T00:00:00Z");
const TOMORROW = new Date("2026-06-10T00:00:00Z");

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

// ── isCouponValid ─────────────────────────────────────────────────────────────

describe("isCouponValid", () => {
  it("isActive false이면 무효", () => {
    expect(isCouponValid({ ...baseRow, isActive: false }, NOW)).toBe(false);
  });

  it("startsAt 이전이면 무효", () => {
    expect(isCouponValid({ ...baseRow, startsAt: TOMORROW }, NOW)).toBe(false);
  });

  it("endsAt 이후이면 무효", () => {
    expect(isCouponValid({ ...baseRow, endsAt: YESTERDAY }, NOW)).toBe(false);
  });

  it("날짜 범위 내 isActive=true이면 유효", () => {
    expect(isCouponValid({ ...baseRow, startsAt: YESTERDAY, endsAt: TOMORROW }, NOW)).toBe(true);
  });

  it("날짜 null이면 영구 유효 (isActive=true)", () => {
    expect(isCouponValid(baseRow, NOW)).toBe(true);
  });

  // minSubtotal alignment — ensures isCouponValid agrees with validateCoupon
  it("subtotal 미제공 시 minSubtotal 체크 생략 (undefined → skip)", () => {
    const row: CouponRow = { ...baseRow, minSubtotal: 50000 };
    // No subtotal passed — minSubtotal not checked, result is true
    expect(isCouponValid(row, NOW)).toBe(true);
  });

  it("subtotal 제공 + minSubtotal 미달 → 무효", () => {
    const row: CouponRow = { ...baseRow, minSubtotal: 50000 };
    expect(isCouponValid(row, NOW, 30000)).toBe(false);
  });

  it("subtotal 제공 + minSubtotal 충족 → 유효", () => {
    const row: CouponRow = { ...baseRow, minSubtotal: 50000 };
    expect(isCouponValid(row, NOW, 50000)).toBe(true);
    expect(isCouponValid(row, NOW, 80000)).toBe(true);
  });
});

// ── computeOrderFigures ───────────────────────────────────────────────────────

describe("computeOrderFigures", () => {
  it("쿠폰 없음: discount=0, total=소계+배송비", () => {
    const { discount, total } = computeOrderFigures(30000, null, NOW);
    expect(discount).toBe(0);
    expect(total).toBe(30000 + BASE_SHIPPING_FEE);
  });

  it("무효 쿠폰(만료): discount=0", () => {
    const expired: CouponRow = { ...baseRow, endsAt: YESTERDAY };
    const { discount } = computeOrderFigures(30000, expired, NOW);
    expect(discount).toBe(0);
  });

  it("정액 쿠폰: discount=3000, total 재계산", () => {
    const { discount, total } = computeOrderFigures(30000, baseRow, NOW);
    expect(discount).toBe(3000);
    // 30000 - 3000 = 27000 → 27000 < 50000 → +3000 shipping
    expect(total).toBe(27000 + BASE_SHIPPING_FEE);
  });

  it("정률 쿠폰 + 상한: discount=5000 (80000 * 10% cap 5000)", () => {
    const pctRow: CouponRow = {
      ...baseRow,
      discountType: "percent",
      discountValue: 10,
      minSubtotal: 30000,
      maxDiscount: 5000,
    };
    const { discount, total } = computeOrderFigures(80000, pctRow, NOW);
    expect(discount).toBe(5000);
    expect(total).toBe(75000); // 80000-5000=75000 ≥ 50000 → free ship
  });

  it("최소주문 미달: minSubtotal 초과 쿠폰은 discount=0", () => {
    const minRow: CouponRow = { ...baseRow, minSubtotal: 50000 };
    const { discount } = computeOrderFigures(30000, minRow, NOW);
    expect(discount).toBe(0);
  });

  it("할인 후 5만원 이상이면 무료배송", () => {
    const row: CouponRow = { ...baseRow, discountValue: 1000, minSubtotal: 0 };
    const { total } = computeOrderFigures(55000, row, NOW);
    expect(total).toBe(54000); // 55000-1000=54000 ≥ 50000 → free
  });
});
