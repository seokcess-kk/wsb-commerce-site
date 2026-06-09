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
  it("max만: max 미만 (상한 배타)", () => {
    const result = filterByPrice(items, undefined, 20000);
    expect(result.map((r) => r.basePrice)).toEqual([5000, 10000]);
  });
  it("min+max: 반개구간 [min, max) — max 제외", () => {
    const result = filterByPrice(items, 10000, 30000);
    expect(result.map((r) => r.basePrice)).toEqual([10000, 20000]);
  });
  it("둘 다 undefined: 전체 반환", () => {
    const result = filterByPrice(items, undefined, undefined);
    expect(result).toHaveLength(5);
  });
  it("경계: min 포함, max 배타", () => {
    const result = filterByPrice(items, 5000, 10000);
    expect(result.map((r) => r.basePrice)).toEqual([5000]); // 5000 포함, 10000 제외
  });
  it("인접 프리셋이 경계값에서 겹치지 않음", () => {
    // "1~3만" = [10000, 30000), "3만~" = [30000, ∞) — 30000은 한쪽에만 속함
    const oneToThree = filterByPrice(items, 10000, 30000).map((r) => r.basePrice);
    const threePlus = filterByPrice(items, 30000, undefined).map((r) => r.basePrice);
    expect(oneToThree).not.toContain(30000);
    expect(threePlus).toContain(30000);
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
