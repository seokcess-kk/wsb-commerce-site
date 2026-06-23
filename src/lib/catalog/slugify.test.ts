import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slugify";

describe("slugify", () => {
  it("영문 상품명 → 소문자 하이픈", () => {
    expect(slugify("NUTROGIN FOCUS")).toBe("nutrogin-focus");
  });
  it("연속 공백·하이픈 정규화", () => {
    expect(slugify("WSB   Immune --  Balance")).toBe("wsb-immune-balance");
  });
  it("특수문자 제거", () => {
    expect(slugify("Vita-Day! 100% (Plus)")).toBe("vita-day-100-plus");
  });
  it("양끝 하이픈 제거", () => {
    expect(slugify("-- hello --")).toBe("hello");
  });
  it("비ASCII(한글)는 제거", () => {
    expect(slugify("WSB 이뮨 밸런스")).toBe("wsb");
  });
  it("한글만 있으면 fallback", () => {
    expect(slugify("이뮨밸런스")).toBe("item");
    expect(slugify("")).toBe("item");
  });
});

describe("uniqueSlug", () => {
  it("충돌 없으면 그대로", () => {
    expect(uniqueSlug("focus", new Set())).toBe("focus");
  });
  it("충돌하면 -2", () => {
    expect(uniqueSlug("focus", new Set(["focus"]))).toBe("focus-2");
  });
  it("연쇄 충돌은 다음 빈 번호", () => {
    expect(uniqueSlug("focus", new Set(["focus", "focus-2", "focus-3"]))).toBe("focus-4");
  });
});
