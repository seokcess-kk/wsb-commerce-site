import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartView } from "./cart-view";
import type { CartItem } from "@/lib/cart/cart-logic";

const items: CartItem[] = [
  { variantId: "v1", productSlug: "nutrogin-focus", name: "FOCUS / 1박스", unitPrice: 39000, quantity: 1, thumbnail: null },
];
const noop = () => {};

describe("CartView", () => {
  it("항목과 소계·배송비·총액을 표시한다", () => {
    render(<CartView items={items} subtotal={39000} onSetQty={noop} onRemove={noop} />);
    expect(screen.getByText("FOCUS / 1박스")).toBeInTheDocument();
    expect(screen.getAllByText("₩39,000").length).toBeGreaterThanOrEqual(1); // 단가/소계
    expect(screen.getByText("₩3,000")).toBeInTheDocument();   // 배송비
    expect(screen.getByText("₩42,000")).toBeInTheDocument();  // 총액
  });
  it("빈 장바구니 문구를 표시한다", () => {
    render(<CartView items={[]} subtotal={0} onSetQty={noop} onRemove={noop} />);
    expect(screen.getByText(/장바구니가 비어/)).toBeInTheDocument();
  });
  it("제거 버튼이 콜백을 호출한다", async () => {
    const onRemove = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<CartView items={items} subtotal={39000} onSetQty={noop} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "FOCUS / 1박스 삭제" }));
    expect(onRemove).toHaveBeenCalledWith("v1");
  });
});
