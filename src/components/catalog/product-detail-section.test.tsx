import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductDetailSection } from "./product-detail-section";

const BASE_PROPS = {
  description: null,
  images: [],
  functionality: null,
  intakeNotice: null,
  ingredients: null,
  isNutrogin: false,
  productName: "테스트 상품",
};

describe("ProductDetailSection", () => {
  it("description이 없으면 placeholder 텍스트를 렌더한다", () => {
    render(<ProductDetailSection {...BASE_PROPS} />);
    expect(screen.getByText("상세 설명이 곧 제공됩니다.")).toBeDefined();
  });

  it("description이 있으면 내용을 렌더한다", () => {
    render(
      <ProductDetailSection
        {...BASE_PROPS}
        description={"첫 번째 단락.\n두 번째 단락."}
      />
    );
    // whitespace-pre-line: RTL normalizes whitespace in getByText,
    // so match by partial text present in the paragraph element
    expect(screen.getByText(/첫 번째 단락/)).toBeDefined();
  });

  it("이미지가 1개 이하면 상세 이미지 준비중 placeholder를 렌더한다", () => {
    render(<ProductDetailSection {...BASE_PROPS} images={["/products/test.png"]} />);
    expect(screen.getByText("상세 이미지 준비중")).toBeDefined();
  });

  it("이미지가 2개 이상이면 두 번째 이미지를 alt로 렌더한다", () => {
    render(
      <ProductDetailSection
        {...BASE_PROPS}
        images={["/products/main.png", "/products/detail.png"]}
      />
    );
    expect(screen.getByAltText("테스트 상품 상세 이미지 1")).toBeDefined();
  });

  it("제품 정보가 있으면 테이블을 렌더한다", () => {
    render(
      <ProductDetailSection
        {...BASE_PROPS}
        functionality="인지능력 개선에 도움을 줄 수 있음"
        ingredients="홍삼농축액, 비타민 B군"
      />
    );
    expect(screen.getByText("제품 정보")).toBeDefined();
    expect(screen.getByText("인지능력 개선에 도움을 줄 수 있음")).toBeDefined();
    expect(screen.getByText("홍삼농축액, 비타민 B군")).toBeDefined();
  });

  it("제품 정보가 없으면 테이블을 렌더하지 않는다", () => {
    render(<ProductDetailSection {...BASE_PROPS} />);
    expect(screen.queryByText("제품 정보")).toBeNull();
  });
});
