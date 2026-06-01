import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("건강기능식품 규제 고지 문구를 포함한다", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/질병의 예방·치료를 위한 것이 아닙니다/)).toBeInTheDocument();
  });

  it("사업자 정보를 포함한다", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/우리스마트바이오/)).toBeInTheDocument();
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
});
