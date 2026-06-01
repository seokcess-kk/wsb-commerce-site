import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "./mobile-nav";

const items = [
  { href: "/category/brain-focus", label: "두뇌·집중" },
  { href: "/brand", label: "브랜드" },
];

describe("MobileNav", () => {
  it("처음엔 메뉴가 닫혀 있다", () => {
    render(<MobileNav items={items} />);
    expect(screen.queryByRole("link", { name: "두뇌·집중" })).not.toBeInTheDocument();
  });
  it("버튼을 누르면 메뉴가 열리고 링크가 보인다", async () => {
    render(<MobileNav items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toHaveAttribute("href", "/category/brain-focus");
  });
});
