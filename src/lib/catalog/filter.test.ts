import { describe, it, expect } from "vitest";
import { filterByPrice } from "./sort";
import type { ProductSummary } from "./product-view";

const base: ProductSummary = {
  id: "1", slug: "a", name: "제품", brand: "WSB",
  basePrice: 0, isNutrogin: false, priceLabel: "₩0",
  thumbnail: null, summary: null, categorySlug: null, categoryName: null,
};

const items: ProductSummary[] = [
  { ...base, id: "1", basePrice: 5000 },
  { ...base, id: "2", basePrice: 10000 },
  { ...base, id: "3", basePrice: 20000 },
  { ...base, id: "4", basePrice: 30000 },
  { ...base, id: "5", basePrice: 50000 },
];

describe("filterByPrice", () => {
  it("min만: min 이상", () => {
    const result = filterByPrice(items, 20000, undefined);
    expect(result.map((r) => r.basePrice)).toEqual([20000, 30000, 50000]);
  });
  it("max만: max 이하", () => {
    const result = filterByPrice(items, undefined, 20000);
    expect(result.map((r) => r.basePrice)).toEqual([5000, 10000, 20000]);
  });
  it("min+max: 범위 내 (포함)", () => {
    const result = filterByPrice(items, 10000, 30000);
    expect(result.map((r) => r.basePrice)).toEqual([10000, 20000, 30000]);
  });
  it("둘 다 undefined: 전체 반환", () => {
    const result = filterByPrice(items, undefined, undefined);
    expect(result).toHaveLength(5);
  });
  it("경계값 min과 일치하는 항목 포함", () => {
    const result = filterByPrice(items, 5000, 5000);
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });
  it("범위 밖: 빈 배열", () => {
    const result = filterByPrice(items, 100000, 200000);
    expect(result).toHaveLength(0);
  });
  it("원본 배열 변경하지 않음", () => {
    const original = items.length;
    filterByPrice(items, 0, 10000);
    expect(items).toHaveLength(original);
  });
});
