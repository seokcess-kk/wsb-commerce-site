import { describe, it, expect } from "vitest";
import { decideDepositAction } from "./settle";

describe("decideDepositAction", () => {
  it("입금 완료 + 금액 일치 → settle", () => {
    expect(decideDepositAction("DONE", 30000, 30000)).toBe("settle");
  });

  it("입금 완료지만 금액 불일치 → amount_mismatch", () => {
    expect(decideDepositAction("DONE", 25000, 30000)).toBe("amount_mismatch");
  });

  it("입금 대기 상태 → ignore", () => {
    expect(decideDepositAction("WAITING_FOR_DEPOSIT", 30000, 30000)).toBe("ignore");
  });

  it("입금 취소 → ignore", () => {
    expect(decideDepositAction("CANCELED", 30000, 30000)).toBe("ignore");
  });
});
