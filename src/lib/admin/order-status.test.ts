import { describe, it, expect } from "vitest";
import { nextStatuses, isValidTransition, isCancellableByAdmin, STATUS_LABEL, statusLabel } from "./order-status";
describe("order-status", () => {
  it("paid → preparing (취소는 전진 전이에서 제외)", () => { expect(nextStatuses("paid")).toEqual(["preparing"]); });
  it("preparing → shipped", () => { expect(nextStatuses("preparing")).toEqual(["shipped"]); });
  it("shipped → delivered", () => { expect(nextStatuses("shipped")).toEqual(["delivered"]); });
  it("전진 전이에 cancelled 가 없다", () => {
    for (const s of ["paid", "preparing", "shipped"]) expect(nextStatuses(s)).not.toContain("cancelled");
  });
  it("pending/delivered는 전이 없음", () => { expect(nextStatuses("pending")).toEqual([]); expect(nextStatuses("delivered")).toEqual([]); });
  it("유효 전이 검사", () => { expect(isValidTransition("paid","preparing")).toBe(true); expect(isValidTransition("paid","delivered")).toBe(false); });
  it("cancelled 로의 직접 전이는 불가", () => { expect(isValidTransition("paid","cancelled")).toBe(false); expect(isValidTransition("preparing","cancelled")).toBe(false); });
  it("환불 취소 가능 상태: paid/preparing/shipped", () => {
    expect(isCancellableByAdmin("paid")).toBe(true);
    expect(isCancellableByAdmin("preparing")).toBe(true);
    expect(isCancellableByAdmin("shipped")).toBe(true);
    expect(isCancellableByAdmin("pending")).toBe(false);
    expect(isCancellableByAdmin("delivered")).toBe(false);
    expect(isCancellableByAdmin("cancelled")).toBe(false);
  });
  it("라벨 존재", () => { expect(STATUS_LABEL.delivered).toBe("배송 완료"); });
  it("statusLabel: 알려진 상태 → 한글 라벨", () => { expect(statusLabel("shipped")).toBe("발송 완료"); });
  it("statusLabel: 알 수 없는 상태 → 입력 그대로", () => { expect(statusLabel("unknown")).toBe("unknown"); });
});
