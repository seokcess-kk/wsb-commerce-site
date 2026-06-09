import { describe, it, expect } from "vitest";
import { formatKRW, formatDate } from "./format";

describe("formatKRW", () => {
  it("정수 금액을 원화 표기로 변환한다", () => {
    expect(formatKRW(39000)).toBe("₩39,000");
  });

  it("0원을 처리한다", () => {
    expect(formatKRW(0)).toBe("₩0");
  });
});

describe("formatDate", () => {
  it("Date 객체를 한국 날짜 형식으로 변환한다", () => {
    expect(formatDate(new Date("2025-03-15"))).toBe("2025. 03. 15.");
  });

  it("string 날짜를 한국 날짜 형식으로 변환한다", () => {
    expect(formatDate("2025-03-15")).toBe("2025. 03. 15.");
  });
});
