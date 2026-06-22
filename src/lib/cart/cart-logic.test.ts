import { describe, it, expect } from "vitest";
import { addItem, setQuantity, removeItem, cartCount, cartSubtotal, type CartItem } from "./cart-logic";

const a: CartItem = { variantId: "v1", productSlug: "nutrogin-focus", name: "FOCUS / 1박스", unitPrice: 39000, quantity: 1, thumbnail: null };
const b: CartItem = { variantId: "v2", productSlug: "wsb-vita-day", name: "비타데이 / 1박스", unitPrice: 22000, quantity: 2, thumbnail: null };

describe("cart-logic", () => {
  it("새 항목을 추가한다", () => {
    expect(addItem([], a)).toHaveLength(1);
  });
  it("같은 variant를 추가하면 수량이 합쳐진다", () => {
    const r = addItem([a], { ...a, quantity: 2 });
    expect(r).toHaveLength(1);
    expect(r[0].quantity).toBe(3);
  });
  it("수량을 변경한다(최소 1)", () => {
    expect(setQuantity([a], "v1", 5)[0].quantity).toBe(5);
    expect(setQuantity([a], "v1", 0)[0].quantity).toBe(1);
  });
  it("항목을 제거한다", () => {
    expect(removeItem([a, b], "v1")).toHaveLength(1);
  });
  it("총 수량과 소계를 계산한다", () => {
    expect(cartCount([a, b])).toBe(3);
    expect(cartSubtotal([a, b])).toBe(39000 + 22000 * 2);
  });

  it("maxStock 이 있으면 추가 시 재고 상한으로 캡한다", () => {
    const s: CartItem = { ...a, quantity: 1, maxStock: 3 };
    const r = addItem([s], { ...s, quantity: 5 }); // 1 + 5 = 6 → 3 으로 캡
    expect(r[0].quantity).toBe(3);
    expect(r[0].maxStock).toBe(3);
  });
  it("maxStock 이 있으면 수량 변경 시 상한을 넘지 못한다", () => {
    const s: CartItem = { ...a, quantity: 1, maxStock: 2 };
    expect(setQuantity([s], "v1", 9)[0].quantity).toBe(2);
    expect(setQuantity([s], "v1", 1)[0].quantity).toBe(1);
  });
  it("maxStock 이 없으면(구버전 카트) 캡하지 않는다", () => {
    const r = addItem([a], { ...a, quantity: 10 });
    expect(r[0].quantity).toBe(11);
  });
});
