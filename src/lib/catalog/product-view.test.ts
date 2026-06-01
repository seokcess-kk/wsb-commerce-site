import { describe, it, expect } from "vitest";
import { toProductSummary, displayPriceLabel, isNutroginBrand } from "./product-view";

const row = {
  id: "p1", slug: "nutrogin-focus", name: "NUTROGIN FOCUS", brand: "NUTROGIN",
  basePrice: 39000, summary: "요약", images: ["/a.png"], isPublished: true,
  categorySlug: "brain-focus", categoryName: "두뇌·집중",
};

describe("toProductSummary", () => {
  it("DB 행을 요약 뷰모델로 변환한다", () => {
    const vm = toProductSummary(row);
    expect(vm.slug).toBe("nutrogin-focus");
    expect(vm.priceLabel).toBe("₩39,000");
    expect(vm.thumbnail).toBe("/a.png");
    expect(vm.isNutrogin).toBe(true);
  });
  it("이미지가 없으면 thumbnail은 null", () => {
    expect(toProductSummary({ ...row, images: [] }).thumbnail).toBeNull();
  });
});

describe("displayPriceLabel", () => {
  it("기본가를 원화로 표기한다", () => {
    expect(displayPriceLabel(28000)).toBe("₩28,000");
  });
});

describe("isNutroginBrand", () => {
  it("브랜드 대소문자 무관하게 NUTROGIN을 인식한다", () => {
    expect(isNutroginBrand("nutrogin")).toBe(true);
    expect(isNutroginBrand("WSB")).toBe(false);
  });
});
