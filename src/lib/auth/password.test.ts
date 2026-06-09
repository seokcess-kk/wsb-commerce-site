import { describe, it, expect } from "vitest";
import { validateNewPassword } from "./password";

describe("validateNewPassword", () => {
  it("8자 미만이면 실패", () => {
    const result = validateNewPassword("short1", "short1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/8자/);
  });

  it("비밀번호 불일치면 실패", () => {
    const result = validateNewPassword("password1", "password2");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/일치/);
  });

  it("8자 이상 + 일치면 통과", () => {
    const result = validateNewPassword("password1", "password1");
    expect(result.ok).toBe(true);
  });

  it("정확히 8자도 통과", () => {
    const result = validateNewPassword("12345678", "12345678");
    expect(result.ok).toBe(true);
  });
});
