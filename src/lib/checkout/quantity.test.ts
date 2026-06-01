import { describe, it, expect } from "vitest";
import { parseQuantity, MAX_QUANTITY } from "./quantity";

describe("parseQuantity", () => {
  it("정상 수량을 통과시킨다", () => { expect(parseQuantity(3)).toBe(3); expect(parseQuantity("2")).toBe(2); });
  it("최대치를 넘으면 null", () => { expect(parseQuantity(MAX_QUANTITY + 1)).toBeNull(); });
  it("0·음수·비정상은 null", () => {
    expect(parseQuantity(0)).toBeNull();
    expect(parseQuantity(-1)).toBeNull();
    expect(parseQuantity(NaN)).toBeNull();
    expect(parseQuantity("abc")).toBeNull();
    expect(parseQuantity(1e308)).toBeNull(); // overflow guard via MAX
  });
});
