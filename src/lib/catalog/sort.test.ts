import { describe, it, expect } from "vitest";
import { SORT_OPTIONS, sortProductSummaries } from "./sort";
import type { ProductSummary } from "./product-view";

const base: ProductSummary = {
  id: "1", slug: "a", name: "가나다", brand: "WSB",
  basePrice: 20000, isNutrogin: false, priceLabel: "₩20,000",
  thumbnail: null, summary: null, categorySlug: null, categoryName: null,
};

const items: ProductSummary[] = [
  { ...base, id: "1", name: "가나다", basePrice: 30000, priceLabel: "₩30,000" },
  { ...base, id: "2", name: "마바사", basePrice: 10000, priceLabel: "₩10,000" },
  { ...base, id: "3", name: "아자차", basePrice: 20000, priceLabel: "₩20,000" },
];

describe("SORT_OPTIONS", () => {
  it("4가지 키를 가진다", () => {
    const keys = SORT_OPTIONS.map((o) => o.key);
    expect(keys).toContain("newest");
    expect(keys).toContain("price_asc");
    expect(keys).toContain("price_desc");
    expect(keys).toContain("name");
    expect(SORT_OPTIONS).toHaveLength(4);
  });
  it("각 옵션에 label이 있다", () => {
    SORT_OPTIONS.forEach((o) => expect(o.label).toBeTruthy());
  });
});

describe("sortProductSummaries", () => {
  it("price_asc: 가격 낮은 순", () => {
    const result = sortProductSummaries(items, "price_asc");
    expect(result.map((r) => r.basePrice)).toEqual([10000, 20000, 30000]);
  });
  it("price_desc: 가격 높은 순", () => {
    const result = sortProductSummaries(items, "price_desc");
    expect(result.map((r) => r.basePrice)).toEqual([30000, 20000, 10000]);
  });
  it("name: localeCompare 오름차순", () => {
    const result = sortProductSummaries(items, "name");
    expect(result.map((r) => r.name)).toEqual(["가나다", "마바사", "아자차"]);
  });
  it("name: 역순 입력도 정렬됨", () => {
    const shuffled = [items[2], items[0], items[1]];
    const result = sortProductSummaries(shuffled, "name");
    expect(result.map((r) => r.name)).toEqual(["가나다", "마바사", "아자차"]);
  });
  it("newest: 입력 순서 유지 (createdAt 없음)", () => {
    const result = sortProductSummaries(items, "newest");
    expect(result.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
  it("원본 배열을 변경하지 않는다", () => {
    const original = [...items];
    sortProductSummaries(items, "price_asc");
    expect(items.map((r) => r.id)).toEqual(original.map((r) => r.id));
  });
  it("미지원 키는 입력 순서 유지", () => {
    const result = sortProductSummaries(items, "unknown" as never);
    expect(result.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});
