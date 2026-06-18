import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("건강기능식품 규제 고지 문구를 포함한다", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/질병의 예방·치료를 위한 것이 아닙니다/)).toBeInTheDocument();
  });

  it("사업자 정보(상호·대표자·사업자번호·통신판매업번호)를 포함한다", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/우리스마트바이오/)).toBeInTheDocument();
    expect(screen.getByText(/대표 주종문/)).toBeInTheDocument();
    expect(screen.getByText(/361-88-01159/)).toBeInTheDocument();
    expect(screen.getByText(/제2025-경기연천-00016호/)).toBeInTheDocument();
    expect(screen.getByText(/경기도 연천군 연천읍 차옥로 149/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "031-834-4515" })
    ).toHaveAttribute("href", "tel:031-834-4515");
    expect(
      screen.getByRole("link", { name: "dasom@woorismartbio.com" })
    ).toHaveAttribute("href", "mailto:dasom@woorismartbio.com");
  });

  it("개인정보처리방침 링크가 올바른 href를 가진다", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("link", { name: "개인정보처리방침" })
    ).toHaveAttribute("href", "/policy/privacy");
  });

  it("이용약관 링크가 올바른 href를 가진다", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("link", { name: "이용약관" })
    ).toHaveAttribute("href", "/policy/terms");
  });

  it("배송/교환/환불 안내 링크가 올바른 href를 가진다", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("link", { name: "배송/교환/환불 안내" })
    ).toHaveAttribute("href", "/policy/shipping");
  });
});
