import { describe, it, expect } from "vitest";
import { brandColors } from "./design-tokens";

describe("brandColors", () => {
  it("WSB·NUTROGIN 핵심 색을 노출한다", () => {
    expect(brandColors.wsb.green).toBe("#0F5132");
    expect(brandColors.nutrogin.cobalt).toBe("#0047FF");
    expect(brandColors.nutrogin.neon).toBe("#E8FF00");
  });
});
