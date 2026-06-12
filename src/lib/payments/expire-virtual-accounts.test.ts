import { describe, it, expect } from "vitest";
import { classifyDepositSweep } from "./expire-virtual-accounts";

describe("classifyDepositSweep", () => {
  it("입금 완료(DONE) → settle (웹훅 놓친 입금 복구)", () => {
    expect(classifyDepositSweep("DONE")).toBe("settle");
  });

  it("입금 대기(WAITING_FOR_DEPOSIT) → keep", () => {
    expect(classifyDepositSweep("WAITING_FOR_DEPOSIT")).toBe("keep");
  });

  it("만료(EXPIRED) → cancel", () => {
    expect(classifyDepositSweep("EXPIRED")).toBe("cancel");
  });

  it("취소(CANCELED) → cancel", () => {
    expect(classifyDepositSweep("CANCELED")).toBe("cancel");
  });

  it("중단(ABORTED) → cancel", () => {
    expect(classifyDepositSweep("ABORTED")).toBe("cancel");
  });
});
