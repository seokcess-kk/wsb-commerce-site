import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";
import { CartProvider } from "@/lib/cart/cart-context";

vi.mock("./header-auth", () => ({
  HeaderAuth: () => <a href="/login" aria-label="로그인">login</a>,
}));

function renderWithCart(ui: React.ReactElement) {
  return render(<CartProvider>{ui}</CartProvider>);
}

describe("SiteHeader", () => {
  it("WSB 로고와 효능 내비를 렌더한다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByText("WSB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "면역" })).toBeInTheDocument();
  });

  it("모든 효능 카테고리 링크 4개가 렌더된다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "면역" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "수면" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "활력" })).toBeInTheDocument();
  });

  it("유틸리티 아이콘 링크가 aria-label로 접근 가능하다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByRole("link", { name: "검색" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니" })).toBeInTheDocument();
  });

  it("모바일 메뉴 트리거 버튼이 존재한다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toBeInTheDocument();
  });
});
