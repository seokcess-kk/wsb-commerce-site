import { describe, it, expect } from "vitest";

describe("db module", () => {
  // 타임아웃 20s: 전체 스위트 부하 시 postgres/drizzle 모듈 변환·로딩이 기본 5s를 넘길 수 있어 flaky 방지
  it("importing the module does not throw without env", async () => {
    const mod = await import("./index");
    expect(typeof mod.getDb).toBe("function");
    expect(mod.db).toBeDefined();
  }, 20000);
});
