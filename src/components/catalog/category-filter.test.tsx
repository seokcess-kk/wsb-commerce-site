import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryFilter } from "./category-filter";

const cats = [
  { slug: "brain-focus", name: "두뇌·집중" },
  { slug: "immune", name: "면역" },
];

describe("CategoryFilter", () => {
  it("전체 + 카테고리 링크를 렌더한다", () => {
    render(<CategoryFilter categories={cats} activeSlug={null} />);
    expect(screen.getByRole("link", { name: "전체" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toHaveAttribute("href", "/category/brain-focus");
  });
  it("활성 카테고리에 aria-current를 표시한다", () => {
    render(<CategoryFilter categories={cats} activeSlug="immune" />);
    expect(screen.getByRole("link", { name: "면역" })).toHaveAttribute("aria-current", "page");
  });
});
