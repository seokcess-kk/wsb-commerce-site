import { describe, it, expect } from "vitest";
import { applyDefault } from "./address";

type A = { id: string; isDefault: boolean };

describe("applyDefault", () => {
  it("지정한 id만 isDefault:true", () => {
    const input: A[] = [
      { id: "a", isDefault: false },
      { id: "b", isDefault: false },
      { id: "c", isDefault: false },
    ];
    const result = applyDefault(input, "b");
    expect(result.filter((x) => x.isDefault).map((x) => x.id)).toEqual(["b"]);
  });

  it("정확히 하나만 true", () => {
    const input: A[] = [
      { id: "x", isDefault: true },
      { id: "y", isDefault: true },
    ];
    const result = applyDefault(input, "x");
    expect(result.filter((x) => x.isDefault)).toHaveLength(1);
  });

  it("원본 배열을 변경하지 않는다 (no mutation)", () => {
    const input: A[] = [{ id: "a", isDefault: false }];
    const original = input[0];
    applyDefault(input, "a");
    expect(input[0]).toBe(original); // same object reference
    expect(input[0].isDefault).toBe(false); // untouched
  });

  it("unknown id → 전부 false", () => {
    const input: A[] = [
      { id: "a", isDefault: true },
      { id: "b", isDefault: false },
    ];
    const result = applyDefault(input, "nonexistent");
    expect(result.every((x) => !x.isDefault)).toBe(true);
  });
});
