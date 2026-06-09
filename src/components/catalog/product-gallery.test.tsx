import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "./product-gallery";

describe("ProductGallery", () => {
  it("이미지 있음: N개 썸네일을 렌더한다", () => {
    const images = ["/a.png", "/b.png", "/c.png"];
    render(<ProductGallery images={images} fallbackLabel="테스트 상품" />);
    const thumbnails = screen.getAllByRole("button");
    expect(thumbnails).toHaveLength(3);
  });

  it("이미지 있음: 첫 번째 이미지가 메인으로 표시된다", () => {
    const images = ["/a.png", "/b.png"];
    render(<ProductGallery images={images} fallbackLabel="제품" />);
    const mainImg = screen.getByRole("img", { name: "제품 메인 이미지" });
    expect(mainImg).toHaveAttribute("src", expect.stringContaining("a.png"));
  });

  it("썸네일 클릭 시 메인 이미지가 바뀐다", async () => {
    const images = ["/a.png", "/b.png", "/c.png"];
    render(<ProductGallery images={images} fallbackLabel="제품" />);
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]); // click thumbnail 2 (index 1)
    const mainImg = screen.getByRole("img", { name: "제품 메인 이미지" });
    expect(mainImg).toHaveAttribute("src", expect.stringContaining("b.png"));
  });

  it("이미지 없음: fallbackLabel 텍스트를 렌더한다", () => {
    render(<ProductGallery images={[]} fallbackLabel="이미지 없는 상품" />);
    expect(screen.getByText("이미지 없는 상품")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("이미지 없음 + isNutrogin: NUTROGIN 배경 클래스를 가진다", () => {
    const { container } = render(
      <ProductGallery images={[]} fallbackLabel="NG 제품" isNutrogin />,
    );
    expect(container.firstChild).toHaveClass("bg-ng-cobalt");
  });

  it("이미지 없음 + !isNutrogin: stone 배경 클래스를 가진다", () => {
    const { container } = render(
      <ProductGallery images={[]} fallbackLabel="WSB 제품" isNutrogin={false} />,
    );
    expect(container.firstChild).toHaveClass("bg-stone-100");
  });
});
