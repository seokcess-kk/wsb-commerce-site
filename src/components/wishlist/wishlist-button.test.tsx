import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WishlistButton } from "./wishlist-button";

const mockToggle = vi.fn();

vi.mock("@/app/account/wishlist/actions", () => ({
  toggleWishlistAction: (...args: unknown[]) => mockToggle(...args),
}));

beforeEach(() => {
  mockToggle.mockClear();
});

describe("WishlistButton", () => {
  it("initialActive=false 이면 aria-pressed=false로 렌더링된다", () => {
    render(<WishlistButton productId="p1" initialActive={false} />);
    expect(screen.getByRole("button", { name: /찜/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("initialActive=true 이면 aria-pressed=true로 렌더링된다", () => {
    render(<WishlistButton productId="p1" initialActive={true} />);
    expect(screen.getByRole("button", { name: /찜/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("클릭 시 optimistic하게 aria-pressed가 즉시 토글된다", async () => {
    mockToggle.mockResolvedValue({ active: true });
    render(<WishlistButton productId="p1" initialActive={false} />);
    const btn = screen.getByRole("button", { name: /찜/ });
    await userEvent.click(btn);
    // optimistic: becomes true immediately
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("서버 액션이 완료되면 최종 상태를 반영한다", async () => {
    mockToggle.mockResolvedValue({ active: false });
    render(<WishlistButton productId="p1" initialActive={true} />);
    const btn = screen.getByRole("button", { name: /찜/ });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(btn).toHaveAttribute("aria-pressed", "false");
    });
  });
});
