import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewForm } from "./review-form";

const mockOnSubmit = vi.fn();
const mockOnSuccess = vi.fn();

const defaultProps = {
  orderId: "order-1",
  productId: "product-1",
  productName: "테스트 상품",
  onSubmit: mockOnSubmit,
  onSuccess: mockOnSuccess,
};

beforeEach(() => {
  mockOnSubmit.mockClear();
  mockOnSuccess.mockClear();
});

describe("ReviewForm", () => {
  it("상품명을 렌더한다", () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByText("테스트 상품")).toBeInTheDocument();
  });

  it("StarRating 입력 버튼 5개가 존재한다", () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getAllByRole("button", { name: /점/ })).toHaveLength(5);
  });

  it("별점 없이 제출하면 에러를 표시한다", async () => {
    render(<ReviewForm {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/내용/), "충분한 내용입니다");
    await userEvent.click(screen.getByRole("button", { name: "리뷰 등록" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("별점을 선택해 주세요");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("내용 5자 미만이면 에러를 표시한다", async () => {
    render(<ReviewForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: "4점" }));
    await userEvent.type(screen.getByLabelText(/내용/), "짧음");
    await userEvent.click(screen.getByRole("button", { name: "리뷰 등록" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("5자 이상");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("유효한 데이터로 제출하면 onSubmit이 올바른 인자로 호출된다", async () => {
    mockOnSubmit.mockResolvedValue({});
    render(<ReviewForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: "5점" }));
    await userEvent.type(screen.getByLabelText(/내용/), "매우 좋은 상품입니다");
    await userEvent.click(screen.getByRole("button", { name: "리뷰 등록" }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "order-1",
          productId: "product-1",
          rating: 5,
          body: "매우 좋은 상품입니다",
        }),
      );
    });
  });

  it("서버 에러 반환 시 에러 메시지를 표시한다", async () => {
    mockOnSubmit.mockResolvedValue({ error: "이미 작성된 리뷰입니다." });
    render(<ReviewForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: "3점" }));
    await userEvent.type(screen.getByLabelText(/내용/), "충분한 내용입니다");
    await userEvent.click(screen.getByRole("button", { name: "리뷰 등록" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("이미 작성된 리뷰입니다.");
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("성공 시 onSuccess를 호출한다", async () => {
    mockOnSubmit.mockResolvedValue({});
    render(<ReviewForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: "4점" }));
    await userEvent.type(screen.getByLabelText(/내용/), "훌륭한 상품입니다 정말");
    await userEvent.click(screen.getByRole("button", { name: "리뷰 등록" }));
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
