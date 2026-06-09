import { describe, it, expect } from "vitest";
import { orderItemsToCartItems, type ReorderItem } from "./reorder";

const makeItem = (overrides: Partial<ReorderItem> = {}): ReorderItem => ({
  variantId: "v1",
  productSlug: "nutrogin-focus",
  productName: "FOCUS",
  variantName: "1박스",
  unitPrice: 39000,
  quantity: 1,
  thumbnail: null,
  ...overrides,
});

describe("orderItemsToCartItems", () => {
  it("빈 배열 → 빈 배열", () => {
    expect(orderItemsToCartItems([])).toEqual([]);
  });

  it("name을 productName / variantName 형식으로 합친다", () => {
    const result = orderItemsToCartItems([makeItem()]);
    expect(result[0].name).toBe("FOCUS / 1박스");
  });

  it("variantId, productSlug, unitPrice, thumbnail을 그대로 보존한다", () => {
    const item = makeItem({ variantId: "v-abc", productSlug: "wsb-vita", unitPrice: 22000, thumbnail: "img.jpg" });
    const result = orderItemsToCartItems([item]);
    expect(result[0].variantId).toBe("v-abc");
    expect(result[0].productSlug).toBe("wsb-vita");
    expect(result[0].unitPrice).toBe(22000);
    expect(result[0].thumbnail).toBe("img.jpg");
  });

  it("수량을 그대로 보존한다", () => {
    const item = makeItem({ quantity: 3 });
    const result = orderItemsToCartItems([item]);
    expect(result[0].quantity).toBe(3);
  });

  it("여러 항목을 모두 매핑한다", () => {
    const items = [
      makeItem({ variantId: "v1", productName: "FOCUS", variantName: "1박스" }),
      makeItem({ variantId: "v2", productName: "비타데이", variantName: "2박스" }),
    ];
    const result = orderItemsToCartItems(items);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("FOCUS / 1박스");
    expect(result[1].name).toBe("비타데이 / 2박스");
  });

  it("thumbnail이 null인 경우를 처리한다", () => {
    const result = orderItemsToCartItems([makeItem({ thumbnail: null })]);
    expect(result[0].thumbnail).toBeNull();
  });
});
