import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  DATABASE_URL: "postgresql://user:pass@host:5432/postgres",
};

describe("parseEnv", () => {
  it("유효한 환경변수를 통과시킨다", () => {
    expect(parseEnv(valid).DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("URL이 아니면 예외를 던진다", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow();
  });

  it("필수값 누락 시 예외를 던진다", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "" })).toThrow();
  });
});
