import { describe, it, expect } from "vitest";
import { normalizeSearchQuery, toLikePattern } from "./search";

describe("normalizeSearchQuery", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(normalizeSearchQuery("  포커스  ")).toBe("포커스");
  });
  it("연속 공백을 한 칸으로 줄인다", () => {
    expect(normalizeSearchQuery("브레인   케어")).toBe("브레인 케어");
  });
  it("null·undefined·빈 입력은 빈 문자열", () => {
    expect(normalizeSearchQuery(null)).toBe("");
    expect(normalizeSearchQuery(undefined)).toBe("");
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});

describe("toLikePattern", () => {
  it("앞뒤를 %로 감싼다", () => {
    expect(toLikePattern("포커스")).toBe("%포커스%");
  });
  it("LIKE 와일드카드를 이스케이프한다", () => {
    expect(toLikePattern("50%_off")).toBe("%50\\%\\_off%");
  });
  it("백슬래시를 이스케이프한다", () => {
    expect(toLikePattern("a\\b")).toBe("%a\\\\b%");
  });
});
