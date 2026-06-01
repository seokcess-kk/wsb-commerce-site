import { describe, it, expect } from "vitest";
import { toProductSummary, displayPriceLabel, isNutroginBrand, resolveVariantPriceLabel } from "./product-view";

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
    expect(vm.basePrice).toBe(39000);
  });
  it("이미지가 없으면 thumbnail은 null", () => {
    expect(toProductSummary({ ...row, images: [] }).thumbnail).toBeNull();
  });
});

describe("resolveVariantPriceLabel", () => {
  it("기본가에 델타를 더한 금액을 원화로 표기한다", () => {
    expect(resolveVariantPriceLabel(39000, 66300)).toBe("₩105,300");
  });
  it("델타가 0이면 기본가만 표기한다", () => {
    expect(resolveVariantPriceLabel(28000, 0)).toBe("₩28,000");
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
