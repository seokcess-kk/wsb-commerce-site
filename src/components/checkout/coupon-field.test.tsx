import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouponField } from "./coupon-field";

// Mock the server actions
vi.mock("@/app/(storefront)/checkout/coupon-actions", () => ({
  applyCouponAction: vi.fn(),
  listAvailableCouponsAction: vi.fn().mockResolvedValue([]),
}));

import { applyCouponAction, listAvailableCouponsAction } from "@/app/(storefront)/checkout/coupon-actions";

const mockApply = vi.mocked(applyCouponAction);
const mockList = vi.mocked(listAvailableCouponsAction);

const SUBTOTAL = 30000;
const mockOnApply = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockList.mockResolvedValue([]);
});

describe("CouponField", () => {
  it("renders code input and 적용 button", () => {
    render(<CouponField subtotal={SUBTOTAL} onApply={mockOnApply} />);
    expect(screen.getByLabelText("쿠폰 코드")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "적용" })).toBeInTheDocument();
  });

  it("applying a valid code calls onApply with discount and code", async () => {
    mockApply.mockResolvedValue({ ok: true, discount: 3000, code: "WELCOME3000" });

    render(<CouponField subtotal={SUBTOTAL} onApply={mockOnApply} />);
    await userEvent.type(screen.getByLabelText("쿠폰 코드"), "WELCOME3000");
    await userEvent.click(screen.getByRole("button", { name: "적용" }));

    await waitFor(() => {
      expect(mockApply).toHaveBeenCalledWith("WELCOME3000", SUBTOTAL);
      expect(mockOnApply).toHaveBeenCalledWith(3000, "WELCOME3000");
    });
  });

  it("shows applied state with discount and 해제 button after success", async () => {
    mockApply.mockResolvedValue({ ok: true, discount: 3000, code: "WELCOME3000" });

    render(<CouponField subtotal={SUBTOTAL} onApply={mockOnApply} />);
    await userEvent.type(screen.getByLabelText("쿠폰 코드"), "WELCOME3000");
    await userEvent.click(screen.getByRole("button", { name: "적용" }));

    await waitFor(() => {
      expect(screen.getByText("WELCOME3000")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "해제" })).toBeInTheDocument();
    });
  });

  it("clicking 해제 resets the coupon and calls onApply(0, '')", async () => {
    mockApply.mockResolvedValue({ ok: true, discount: 3000, code: "WELCOME3000" });

    render(<CouponField subtotal={SUBTOTAL} onApply={mockOnApply} />);
    await userEvent.type(screen.getByLabelText("쿠폰 코드"), "WELCOME3000");
    await userEvent.click(screen.getByRole("button", { name: "적용" }));
    await waitFor(() => screen.getByRole("button", { name: "해제" }));

    await userEvent.click(screen.getByRole("button", { name: "해제" }));
    expect(mockOnApply).toHaveBeenLastCalledWith(0, "");
    expect(screen.getByLabelText("쿠폰 코드")).toBeInTheDocument();
  });

  it("invalid code shows the reason from the server", async () => {
    mockApply.mockResolvedValue({ ok: false, reason: "존재하지 않는 쿠폰 코드입니다." });

    render(<CouponField subtotal={SUBTOTAL} onApply={mockOnApply} />);
    await userEvent.type(screen.getByLabelText("쿠폰 코드"), "BADCODE");
    await userEvent.click(screen.getByRole("button", { name: "적용" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("존재하지 않는 쿠폰 코드입니다.");
    });
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it("shows quick-apply buttons for available coupons after focusing input", async () => {
    mockList.mockResolvedValue([
      {
        userCouponId: "uc-1",
        usedAt: null,
        orderId: null,
        coupon: {
          id: "c-1",
          code: "WELCOME3000",
          name: "웰컴 쿠폰",
          discountType: "fixed",
          discountValue: 3000,
          minSubtotal: 0,
          maxDiscount: null,
          startsAt: null,
          endsAt: null,
          isActive: true,
          createdAt: new Date(),
        },
      },
    ]);

    render(<CouponField subtotal={SUBTOTAL} onApply={mockOnApply} />);
    await userEvent.click(screen.getByLabelText("쿠폰 코드"));

    await waitFor(() => {
      expect(screen.getByText("웰컴 쿠폰")).toBeInTheDocument();
    });
  });
});
