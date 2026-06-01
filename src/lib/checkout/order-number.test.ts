import { describe, it, expect } from "vitest";
import { buildOrderNumber } from "./order-number";

describe("buildOrderNumber", () => {
  it("WSB-YYYYMMDD-RAND 형식", () => {
    expect(buildOrderNumber(new Date(2026, 5, 30), "ab12")).toMatch(/^WSB-20260630-AB12$/);
  });
});
