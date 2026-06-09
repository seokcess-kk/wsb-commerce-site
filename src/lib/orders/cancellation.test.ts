import { describe, it, expect } from "vitest";
import { availableRequestTypes, REQUEST_TYPE_LABEL } from "./cancellation";

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
