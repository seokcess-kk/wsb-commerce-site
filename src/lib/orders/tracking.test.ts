import { describe, it, expect } from "vitest";
import { trackingUrl, SUPPORTED_COURIERS } from "./tracking";

describe("trackingUrl", () => {
  it("CJ대한통운 추적 URL", () => {
    expect(trackingUrl("CJ대한통운", "123456789012")).toBe(
      "https://trace.cjlogistics.com/next/tracking.html?wblNo=123456789012",
    );
  });

  it("한진택배 추적 URL", () => {
    expect(trackingUrl("한진택배", "999")).toContain("hanjin.com");
    expect(trackingUrl("한진택배", "999")).toContain("999");
  });

  it("우체국택배 추적 URL", () => {
    expect(trackingUrl("우체국", "555")).toContain("epost.go.kr");
  });

  it("영문/대소문자/공백 무관하게 CJ 인식", () => {
    expect(trackingUrl(" cj logistics ", "1")).toContain("cjlogistics.com");
  });

  it("송장번호가 없으면 null", () => {
    expect(trackingUrl("CJ대한통운", "")).toBeNull();
    expect(trackingUrl("CJ대한통운", "   ")).toBeNull();
  });

  it("택배사가 없으면 null", () => {
    expect(trackingUrl("", "123")).toBeNull();
    expect(trackingUrl(null, "123")).toBeNull();
  });

  it("미지원 택배사는 null", () => {
    expect(trackingUrl("듣보택배", "123")).toBeNull();
  });

  it("지원 택배사 목록을 노출한다(폼 안내용)", () => {
    expect(SUPPORTED_COURIERS).toContain("CJ대한통운");
    expect(SUPPORTED_COURIERS.length).toBeGreaterThanOrEqual(4);
  });
});
