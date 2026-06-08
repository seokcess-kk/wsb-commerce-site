import { describe, it, expect } from "vitest";
import { validatePasswordChange } from "./password";

describe("validatePasswordChange", () => {
  it("8자 미만은 거부", () => {
    expect(validatePasswordChange("short1", "short1")).toMatch(/8자/);
  });
  it("불일치는 거부", () => {
    expect(validatePasswordChange("password1", "password2")).toMatch(/일치/);
  });
  it("8자 이상 + 일치는 통과(null)", () => {
    expect(validatePasswordChange("password1", "password1")).toBeNull();
  });
});
