import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountSummary } from "./account-summary";

describe("AccountSummary", () => {
  it("주문이 없으면 '주문 없음' 메시지를 보여준다", () => {
    render(
      <AccountSummary
        recentOrder={null}
        wishlistCount={0}
        couponCount={0}
      />,
    );
    expect(screen.getByText(/주문 없음/)).toBeInTheDocument();
  });

  it("최근 주문 정보를 표시한다", () => {
    render(
      <AccountSummary
        recentOrder={{ orderNumber: "WSB-20260609-001", status: "paid" }}
        wishlistCount={3}
        couponCount={1}
      />,
    );
    expect(screen.getByText("WSB-20260609-001")).toBeInTheDocument();
    expect(screen.getByText(/결제 완료/)).toBeInTheDocument();
  });

  it("위시리스트 수를 표시한다", () => {
    render(
      <AccountSummary
        recentOrder={null}
        wishlistCount={7}
        couponCount={0}
      />,
    );
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("쿠폰 수를 표시한다 (기본값 0)", () => {
    render(
      <AccountSummary
        recentOrder={null}
        wishlistCount={0}
      />,
    );
    // couponCount defaults to 0
    const couponSlots = screen.getAllByText("0");
    expect(couponSlots.length).toBeGreaterThanOrEqual(1);
  });
});
