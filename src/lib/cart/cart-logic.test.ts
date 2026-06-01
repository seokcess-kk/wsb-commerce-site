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
});
