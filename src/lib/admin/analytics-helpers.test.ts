import { describe, it, expect } from "vitest";
import { summarizeCustomers } from "./analytics-helpers";
describe("summarizeCustomers", () => {
  it("재구매/신규/재구매율을 계산", () => {
    const r = summarizeCustomers([{ userId: "a", orderCount: 3 }, { userId: "b", orderCount: 1 }, { userId: "c", orderCount: 2 }]);
    expect(r).toEqual({ total: 3, repeat: 2, newCustomers: 1, repeatRate: 67 });
  });
  it("빈 목록", () => { expect(summarizeCustomers([])).toEqual({ total: 0, repeat: 0, newCustomers: 0, repeatRate: 0 }); });
});
