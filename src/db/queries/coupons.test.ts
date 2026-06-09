import { describe, it, expect } from "vitest";
import { decideApplicable } from "./coupons";

// Shared validation stub for the "passes all checks" path
const VALID = { ok: true as const };
const INVALID = { ok: false as const, reason: "사용할 수 없는 쿠폰입니다." };

describe("decideApplicable — ownership / used branches", () => {
  it("(a) unusedClaim=false, anyClaim=false → 보유하지 않은 쿠폰 (not claimed)", () => {
    const result = decideApplicable({
      unusedClaim: false,
      anyClaim: false,
      validation: VALID,
      discount: 3000,
      code: "WELCOME",
    });
    expect(result).toEqual({ ok: false, reason: "보유하지 않은 쿠폰입니다." });
  });

  it("(b) unusedClaim=false, anyClaim=true → 이미 사용된 쿠폰 (already used)", () => {
    const result = decideApplicable({
      unusedClaim: false,
      anyClaim: true,
      validation: VALID,
      discount: 3000,
      code: "WELCOME",
    });
    expect(result).toEqual({ ok: false, reason: "이미 사용된 쿠폰입니다." });
  });

  it("unusedClaim=true, validation fails → propagates validation reason", () => {
    const result = decideApplicable({
      unusedClaim: true,
      anyClaim: true,
      validation: INVALID,
      discount: 0,
      code: "WELCOME",
    });
    expect(result).toEqual({ ok: false, reason: "사용할 수 없는 쿠폰입니다." });
  });

  it("unusedClaim=true, validation ok → returns ok with discount and code", () => {
    const result = decideApplicable({
      unusedClaim: true,
      anyClaim: true,
      validation: VALID,
      discount: 5000,
      code: "SUMMER5000",
    });
    expect(result).toEqual({ ok: true, discount: 5000, code: "SUMMER5000" });
  });
});
