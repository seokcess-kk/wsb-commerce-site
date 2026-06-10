import { describe, it, expect } from "vitest";
import { brandColors } from "./design-tokens";
import { adminColors } from "./design-tokens";

describe("brandColors", () => {
  it("WSB·NUTROGIN 핵심 색을 노출한다", () => {
    expect(brandColors.wsb.green).toBe("#0F5132");
    expect(brandColors.nutrogin.cobalt).toBe("#0047FF");
    expect(brandColors.nutrogin.neon).toBe("#E8FF00");
  });
});

describe("adminColors", () => {
  it("라이트/다크 핵심 토큰을 노출한다(globals.css와 동기화)", () => {
    expect(adminColors.light.bg).toBe("#F6F7F4");
    expect(adminColors.light.accent).toBe("#177A4B");
    expect(adminColors.dark.bg).toBe("#0B0F0D");
    expect(adminColors.dark.accent).toBe("#3DDC84");
    expect(adminColors.dark.neon).toBe("#E8FF00");
  });
});
