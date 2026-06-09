import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCartButton } from "./add-to-cart-button";

const mockAdd = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/cart/cart-context", () => ({
  useCart: () => ({ add: mockAdd }),
}));

const options = [
  {
    variantId: "v1",
    productSlug: "test-product",
    name: "테스트 / 1박스",
    unitPrice: 39000,
    quantity: 1,
    thumbnail: null,
    stock: 10,
  },
];

beforeEach(() => {
  mockAdd.mockClear();
  mockPush.mockClear();
});

describe("AddToCartButton", () => {
  it("수량 조절 버튼(- / +)이 렌더된다", () => {
    render(<AddToCartButton options={options} />);
    expect(screen.getByRole("button", { name: "수량 감소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수량 증가" })).toBeInTheDocument();
  });

  it("초기 수량은 1이다", () => {
    render(<AddToCartButton options={options} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(1);
  });

  it("+ 버튼 클릭 시 수량이 증가한다", async () => {
    render(<AddToCartButton options={options} />);
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(2);
  });

  it("- 버튼 클릭 시 수량이 감소하며 최소 1", async () => {
    render(<AddToCartButton options={options} />);
    // already at 1, click minus — should stay 1
    await userEvent.click(screen.getByRole("button", { name: "수량 감소" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(1);
    // increment then decrement
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" }));
    await userEvent.click(screen.getByRole("button", { name: "수량 감소" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(1);
  });

  it("- 버튼은 수량 1일 때 비활성화된다", () => {
    render(<AddToCartButton options={options} />);
    expect(screen.getByRole("button", { name: "수량 감소" })).toBeDisabled();
  });

  it("장바구니 담기 시 선택 수량으로 add 호출", async () => {
    render(<AddToCartButton options={options} />);
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" }));
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" }));
    await userEvent.click(screen.getByRole("button", { name: "장바구니 담기" }));
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 3, variantId: "v1" }),
    );
  });

  it("+ 버튼은 stock 한도에서 멈춘다", async () => {
    const limitedOptions = [{ ...options[0], stock: 2 }];
    render(<AddToCartButton options={limitedOptions} />);
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" }));
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" }));
    await userEvent.click(screen.getByRole("button", { name: "수량 증가" })); // over limit
    expect(screen.getByRole("spinbutton")).toHaveValue(2);
  });

  it("품절 옵션은 버튼이 비활성화된다", () => {
    const soldOutOptions = [{ ...options[0], stock: 0 }];
    render(<AddToCartButton options={soldOutOptions} />);
    expect(screen.getByRole("button", { name: "품절" })).toBeDisabled();
  });
});
