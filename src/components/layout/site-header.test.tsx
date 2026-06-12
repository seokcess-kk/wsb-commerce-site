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
  it("NUTROGIN 로고와 라인업 내비를 렌더한다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByText("NUTROGIN")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "라인업" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "브랜드" })).toBeInTheDocument();
  });

  it("NUTROGIN 3종 바로가기 내비가 렌더된다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByRole("link", { name: "집중" })).toHaveAttribute("href", "/products/nutrogin-focus");
    expect(screen.getByRole("link", { name: "각성" })).toHaveAttribute("href", "/products/nutrogin-clear");
    expect(screen.getByRole("link", { name: "숙면" })).toHaveAttribute("href", "/products/nutrogin-rest");
    expect(screen.getByRole("link", { name: "고객지원" })).toBeInTheDocument();
  });

  it("유틸리티 아이콘 링크가 aria-label로 접근 가능하다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByRole("link", { name: "검색" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "찜 목록" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니" })).toBeInTheDocument();
  });

  it("찜 목록 링크가 /account/wishlist로 이동한다", () => {
    renderWithCart(<SiteHeader />);
    const wishlistLink = screen.getByRole("link", { name: "찜 목록" });
    expect(wishlistLink).toHaveAttribute("href", "/account/wishlist");
  });

  it("모바일 메뉴 트리거 버튼이 존재한다", () => {
    renderWithCart(<SiteHeader />);
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toBeInTheDocument();
  });
});
