import { describe, it, expect } from "vitest";
import { signupAgreed } from "./consent";

describe("signupAgreed", () => {
  it("terms + privacy 모두 true면 통과", () => {
    expect(signupAgreed({ terms: true, privacy: true })).toBe(true);
  });

  it("terms 미동의면 false", () => {
    expect(signupAgreed({ terms: false, privacy: true })).toBe(false);
  });

  it("privacy 미동의면 false", () => {
    expect(signupAgreed({ terms: true, privacy: false })).toBe(false);
  });

  it("모두 미동의면 false", () => {
    expect(signupAgreed({ terms: false, privacy: false })).toBe(false);
  });
});
