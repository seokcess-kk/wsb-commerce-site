import { describe, it, expect } from "vitest";
import { PRICE_PRESETS, parsePricePreset } from "./price-presets";

describe("PRICE_PRESETS", () => {
  it("4개의 프리셋이 있다", () => {
    expect(PRICE_PRESETS).toHaveLength(4);
  });

  it("첫 번째 프리셋은 전체(경계 없음)", () => {
    expect(PRICE_PRESETS[0].min).toBeUndefined();
    expect(PRICE_PRESETS[0].max).toBeUndefined();
  });
});

describe("parsePricePreset", () => {
  it("undefined → 경계 없음", () => {
    expect(parsePricePreset(undefined)).toEqual({});
  });

  it("빈 문자열 → 경계 없음", () => {
    expect(parsePricePreset("")).toEqual({});
  });

  it("알 수 없는 키 → 경계 없음", () => {
    expect(parsePricePreset("unknown")).toEqual({});
  });

  it("전체 키(-) → 경계 없음", () => {
    // 전체 preset key is "-" (both undefined → empty string each side)
    expect(parsePricePreset("-")).toEqual({});
  });

  it("~1만 키 → maxPrice 10000만", () => {
    expect(parsePricePreset("-10000")).toEqual({ maxPrice: 10000 });
  });

  it("1~3만 키 → minPrice 10000, maxPrice 30000", () => {
    expect(parsePricePreset("10000-30000")).toEqual({
      minPrice: 10000,
      maxPrice: 30000,
    });
  });

  it("3만~ 키 → minPrice 30000만", () => {
    expect(parsePricePreset("30000-")).toEqual({ minPrice: 30000 });
  });
});
