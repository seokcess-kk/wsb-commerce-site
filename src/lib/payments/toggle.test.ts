import { describe, it, expect } from "vitest";
import { isPaymentsEnabled } from "./toggle";

describe("isPaymentsEnabled", () => {
  it("미설정이면 기본 ON", () => {
    expect(isPaymentsEnabled(undefined)).toBe(true);
    expect(isPaymentsEnabled(null)).toBe(true);
    expect(isPaymentsEnabled("")).toBe(true);
  });
  it('명시적 "false"만 OFF (대소문자·공백 무시)', () => {
    expect(isPaymentsEnabled("false")).toBe(false);
    expect(isPaymentsEnabled("FALSE")).toBe(false);
    expect(isPaymentsEnabled("  false  ")).toBe(false);
  });
  it('"true"·기타 값은 ON', () => {
    expect(isPaymentsEnabled("true")).toBe(true);
    expect(isPaymentsEnabled("1")).toBe(true);
    expect(isPaymentsEnabled("on")).toBe(true);
  });
});
