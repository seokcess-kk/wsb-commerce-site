import { describe, it, expect } from "vitest";
import { safeNext } from "./route";

describe("safeNext", () => {
  it("동일 출처 경로는 허용", () => { expect(safeNext("/account")).toBe("/account"); });
  it("프로토콜 상대 경로는 거부", () => { expect(safeNext("//evil.com")).toBe("/account"); });
  it("절대 URL은 거부", () => { expect(safeNext("https://evil.com")).toBe("/account"); });
  it("null은 기본값", () => { expect(safeNext(null)).toBe("/account"); });
});
