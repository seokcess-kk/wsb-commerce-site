import { describe, it, expect } from "vitest";
import { formatKRW } from "./format";

describe("formatKRW", () => {
  it("정수 금액을 원화 표기로 변환한다", () => {
    expect(formatKRW(39000)).toBe("₩39,000");
  });

  it("0원을 처리한다", () => {
    expect(formatKRW(0)).toBe("₩0");
  });
});
