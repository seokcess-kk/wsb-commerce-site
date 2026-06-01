import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("WSB 로고와 효능 내비를 렌더한다", () => {
    render(<SiteHeader />);
    expect(screen.getByText("WSB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "면역" })).toBeInTheDocument();
  });

  it("모든 효능 카테고리 링크 4개가 렌더된다", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "면역" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "수면" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "활력" })).toBeInTheDocument();
  });

  it("유틸리티 아이콘 링크 3개가 aria-label로 접근 가능하다", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "검색" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "내 계정" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니" })).toBeInTheDocument();
  });

  it("모바일 메뉴 트리거 버튼이 존재한다", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toBeInTheDocument();
  });
});
