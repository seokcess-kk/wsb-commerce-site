import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderList } from "./order-list";
import type { OrderSummaryRow } from "@/db/queries/orders";

const makeOrder = (overrides: Partial<OrderSummaryRow> = {}): OrderSummaryRow => ({
  id: "order-id-1",
  orderNumber: "WSB-20240101-ABCD",
  status: "paid",
  userId: "user-1",
  customerName: "홍길동",
  customerPhone: "010-1234-5678",
  customerEmail: "test@example.com",
  shippingAddress: "서울시 강남구",
  shippingZipcode: "06234",
  itemsSubtotal: 39000,
  shippingFee: 3000,
  totalAmount: 42000,
  courier: null,
  trackingNumber: null,
  couponCode: null,
  couponDiscount: 0,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

describe("OrderList", () => {
  it("주문 번호와 금액을 렌더링한다", () => {
    render(<OrderList orders={[makeOrder()]} />);
    expect(screen.getByText("WSB-20240101-ABCD")).toBeInTheDocument();
    expect(screen.getByText("₩42,000")).toBeInTheDocument();
  });

  it("상태 라벨을 표시한다", () => {
    render(<OrderList orders={[makeOrder({ status: "shipped" })]} />);
    // "발송 완료" appears in both the tab and the order badge
    expect(screen.getAllByText("발송 완료").length).toBeGreaterThanOrEqual(1);
  });

  it("빈 주문 목록 문구를 표시한다", () => {
    render(<OrderList orders={[]} />);
    expect(screen.getByText(/주문 내역이 없습니다/)).toBeInTheDocument();
  });

  it("상태 필터 탭을 모두 렌더링한다", () => {
    render(<OrderList orders={[]} />);
    expect(screen.getByRole("tab", { name: "전체" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "결제 완료" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "발송 완료" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "배송 완료" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "취소" })).toBeInTheDocument();
  });

  it("activeStatus에 맞는 탭이 selected 상태다", () => {
    render(<OrderList orders={[]} activeStatus="paid" />);
    expect(screen.getByRole("tab", { name: "결제 완료" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "전체" })).toHaveAttribute("aria-selected", "false");
  });

  it("여러 주문을 렌더링한다", () => {
    const orders = [
      makeOrder({ id: "o1", orderNumber: "WSB-1111", status: "paid" }),
      makeOrder({ id: "o2", orderNumber: "WSB-2222", status: "shipped" }),
    ];
    render(<OrderList orders={orders} />);
    expect(screen.getByText("WSB-1111")).toBeInTheDocument();
    expect(screen.getByText("WSB-2222")).toBeInTheDocument();
  });
});
