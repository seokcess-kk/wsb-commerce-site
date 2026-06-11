import { describe, it, expect } from "vitest";
import { publishedFromView, clampPage, productTotalPages } from "./product-list-params";

describe("publishedFromView", () => {
  it("visible → true", () => expect(publishedFromView("visible")).toBe(true));
  it("hidden → false", () => expect(publishedFromView("hidden")).toBe(false));
  it("빈 문자열/undefined/미지값 → undefined(전체)", () => {
    expect(publishedFromView("")).toBeUndefined();
    expect(publishedFromView(undefined)).toBeUndefined();
    expect(publishedFromView("all")).toBeUndefined();
  });
});

describe("clampPage", () => {
  it("정상 값은 정수로 통과", () => expect(clampPage("3")).toBe(3));
  it("1 미만·비숫자·undefined는 1로 클램프", () => {
    expect(clampPage("0")).toBe(1);
    expect(clampPage("-2")).toBe(1);
    expect(clampPage("abc")).toBe(1);
    expect(clampPage(undefined)).toBe(1);
  });
  it("소수는 내림", () => expect(clampPage("2.9")).toBe(2));
});

describe("productTotalPages", () => {
  it("올림 계산", () => expect(productTotalPages(61, 30)).toBe(3));
  it("정확히 나누어떨어지면 그대로", () => expect(productTotalPages(60, 30)).toBe(2));
  it("0건이어도 최소 1페이지", () => expect(productTotalPages(0, 30)).toBe(1));
});
