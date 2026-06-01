import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "./product-grid";
import type { ProductSummary } from "@/lib/catalog/product-view";

const mk = (slug: string, name: string): ProductSummary => ({
  id: slug, slug, name, brand: "WSB", basePrice: 10000, isNutrogin: false, priceLabel: "₩10,000",
  thumbnail: null, summary: null, categorySlug: null, categoryName: null,
});

describe("ProductGrid", () => {
  it("여러 상품 카드를 렌더한다", () => {
    render(<ProductGrid products={[mk("a", "상품 A"), mk("b", "상품 B")]} />);
    expect(screen.getByText("상품 A")).toBeInTheDocument();
    expect(screen.getByText("상품 B")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
  it("상품이 없으면 빈 상태 문구를 보여준다", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText(/상품이 없습니다/)).toBeInTheDocument();
  });
});
