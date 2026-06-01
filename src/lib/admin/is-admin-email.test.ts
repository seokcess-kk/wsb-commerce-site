import { describe, it, expect } from "vitest";
import { isAdminEmail } from "./is-admin-email";
describe("isAdminEmail", () => {
  it("허용목록에 있으면 true(대소문자/공백 무관)", () => {
    expect(isAdminEmail("Admin@WSB.com", " admin@wsb.com , b@b.com")).toBe(true);
  });
  it("없으면 false", () => {
    expect(isAdminEmail("x@y.com", "admin@wsb.com")).toBe(false);
    expect(isAdminEmail(null, "admin@wsb.com")).toBe(false);
    expect(isAdminEmail("a@a.com", undefined)).toBe(false);
  });
});
