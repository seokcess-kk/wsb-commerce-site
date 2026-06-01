import { describe, it, expect } from "vitest";

describe("db module", () => {
  it("importing the module does not throw without env", async () => {
    const mod = await import("./index");
    expect(typeof mod.getDb).toBe("function");
    expect(mod.db).toBeDefined();
  });
});
