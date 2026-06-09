import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReorderButton } from "./reorder-button";
import type { ReorderItem } from "@/lib/cart/reorder";

const mockAdd = vi.fn();
const mockPush = vi.fn();
const mockAlert = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/cart/cart-context", () => ({
  useCart: () => ({ add: mockAdd }),
}));

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

beforeEach(() => {
  mockAdd.mockClear();
  mockPush.mockClear();
  mockAlert.mockClear();
  vi.stubGlobal("alert", mockAlert);
});

describe("ReorderButton", () => {
  it("재주문 버튼을 항상 렌더링한다", () => {
    render(<ReorderButton items={[]} />);
    expect(screen.getByRole("button", { name: "재주문" })).toBeInTheDocument();
  });

  it("items가 비어있을 때 클릭하면 alert을 표시하고 /cart로 이동하지 않는다", async () => {
    render(<ReorderButton items={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "재주문" }));
    expect(mockAlert).toHaveBeenCalledWith("재주문 가능한 상품이 없습니다.");
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("items가 있을 때 클릭하면 cart에 추가하고 /cart로 이동한다", async () => {
    const items = [makeItem({ variantId: "v1" }), makeItem({ variantId: "v2" })];
    render(<ReorderButton items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "재주문" }));
    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledWith("/cart");
    expect(mockAlert).not.toHaveBeenCalled();
  });
});
