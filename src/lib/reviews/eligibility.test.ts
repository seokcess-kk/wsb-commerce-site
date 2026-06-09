import { describe, it, expect } from "vitest";
import { reviewKey, canReview } from "./eligibility";

describe("reviewKey", () => {
  it("orderId와 productId를 콜론으로 연결한다", () => {
    expect(reviewKey("order-1", "product-2")).toBe("order-1:product-2");
  });
});

describe("canReview", () => {
  it("delivered + 미작성 → true", () => {
    expect(canReview("delivered", false)).toBe(true);
  });

  it("delivered + 이미 작성 → false", () => {
    expect(canReview("delivered", true)).toBe(false);
  });

  it("pending 상태 → false", () => {
    expect(canReview("pending", false)).toBe(false);
  });

  it("paid 상태 → false", () => {
    expect(canReview("paid", false)).toBe(false);
  });

  it("shipped 상태 → false", () => {
    expect(canReview("shipped", false)).toBe(false);
  });

  it("cancelled 상태 → false", () => {
    expect(canReview("cancelled", false)).toBe(false);
  });
});
