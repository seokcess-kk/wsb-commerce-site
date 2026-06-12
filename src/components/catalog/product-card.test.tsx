import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";
import type { ProductSummary } from "@/lib/catalog/product-view";

const base: ProductSummary = {
  id: "1", slug: "nutrogin-focus", name: "NUTROGIN FOCUS", brand: "NUTROGIN",
  basePrice: 39000, isNutrogin: true, priceLabel: "₩39,000", thumbnail: "/a.png", summary: "요약",
  categorySlug: "brain-focus", categoryName: "두뇌·집중",
};

describe("ProductCard", () => {
  it("상품명·가격·상세 링크를 렌더한다", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByRole("heading", { name: "NUTROGIN FOCUS" })).toBeInTheDocument();
    expect(screen.getByText("₩39,000")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/nutrogin-focus");
  });
  it("NUTROGIN 상품은 브랜드 뱃지를 보여준다", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText("NUTROGIN")).toBeInTheDocument();
  });
  it("WSB 상품은 NUTROGIN 뱃지를 보여주지 않는다", () => {
    render(<ProductCard product={{ ...base, brand: "WSB", isNutrogin: false, name: "WSB 이뮨" }} />);
    expect(screen.queryByText("NUTROGIN")).not.toBeInTheDocument();
  });
});
