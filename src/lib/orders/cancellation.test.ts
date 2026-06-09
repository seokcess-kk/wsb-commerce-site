import { describe, it, expect } from "vitest";
import {
  availableRequestTypes,
  REQUEST_TYPE_LABEL,
  nextCancellationStatuses,
  canProcessCancellation,
  CANCELLATION_STATUS_LABEL,
  refundAmount,
} from "./cancellation";

describe("availableRequestTypes", () => {
  it("paid → cancel만 가능", () => {
    expect(availableRequestTypes("paid")).toEqual(["cancel"]);
  });
  it("preparing → cancel만 가능", () => {
    expect(availableRequestTypes("preparing")).toEqual(["cancel"]);
  });
  it("shipped → exchange, return 가능", () => {
    expect(availableRequestTypes("shipped")).toEqual(["exchange", "return"]);
  });
  it("delivered → exchange, return 가능", () => {
    expect(availableRequestTypes("delivered")).toEqual(["exchange", "return"]);
  });
  it("pending → 빈 배열", () => {
    expect(availableRequestTypes("pending")).toEqual([]);
  });
  it("cancelled → 빈 배열", () => {
    expect(availableRequestTypes("cancelled")).toEqual([]);
  });
  it("알 수 없는 상태 → 빈 배열", () => {
    expect(availableRequestTypes("unknown")).toEqual([]);
  });
});

describe("REQUEST_TYPE_LABEL", () => {
  it("cancel → 취소", () => {
    expect(REQUEST_TYPE_LABEL.cancel).toBe("취소");
  });
  it("exchange → 교환", () => {
    expect(REQUEST_TYPE_LABEL.exchange).toBe("교환");
  });
  it("return → 반품", () => {
    expect(REQUEST_TYPE_LABEL.return).toBe("반품");
  });
});

describe("nextCancellationStatuses", () => {
  it("requested → refunded, rejected", () => {
    expect(nextCancellationStatuses("requested")).toEqual(["refunded", "rejected"]);
  });
  it("refunded/rejected는 전이 없음(종료 상태)", () => {
    expect(nextCancellationStatuses("refunded")).toEqual([]);
    expect(nextCancellationStatuses("rejected")).toEqual([]);
  });
  it("알 수 없는 상태 → 빈 배열", () => {
    expect(nextCancellationStatuses("unknown")).toEqual([]);
  });
});

describe("canProcessCancellation", () => {
  it("requested만 처리 가능", () => {
    expect(canProcessCancellation("requested")).toBe(true);
    expect(canProcessCancellation("refunded")).toBe(false);
    expect(canProcessCancellation("rejected")).toBe(false);
  });
});

describe("CANCELLATION_STATUS_LABEL", () => {
  it("상태 라벨", () => {
    expect(CANCELLATION_STATUS_LABEL.requested).toBe("접수");
    expect(CANCELLATION_STATUS_LABEL.refunded).toBe("환불완료");
    expect(CANCELLATION_STATUS_LABEL.rejected).toBe("반려");
  });
});

describe("refundAmount", () => {
  it("v1 전체취소 = 주문 총액", () => {
    expect(refundAmount({ totalAmount: 39000 })).toBe(39000);
  });
});
