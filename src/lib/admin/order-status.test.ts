import { describe, it, expect } from "vitest";
import { nextStatuses, isValidTransition, STATUS_LABEL } from "./order-status";
describe("order-status", () => {
  it("paid → preparing/cancelled", () => { expect(nextStatuses("paid")).toEqual(["preparing", "cancelled"]); });
  it("shipped → delivered", () => { expect(nextStatuses("shipped")).toEqual(["delivered"]); });
  it("pending/delivered는 전이 없음", () => { expect(nextStatuses("pending")).toEqual([]); expect(nextStatuses("delivered")).toEqual([]); });
  it("유효 전이 검사", () => { expect(isValidTransition("paid","preparing")).toBe(true); expect(isValidTransition("paid","delivered")).toBe(false); });
  it("라벨 존재", () => { expect(STATUS_LABEL.delivered).toBe("배송 완료"); });
});
