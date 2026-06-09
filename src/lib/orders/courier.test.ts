import { describe, it, expect } from "vitest";
import { trackingUrl } from "./courier";

describe("trackingUrl", () => {
  it("CJ대한통운 추적 URL을 반환한다", () => {
    const url = trackingUrl("CJ대한통운", "1234567890");
    expect(url).toContain("1234567890");
    expect(url).toContain("cjlogistics.com");
  });

  it("한진택배 추적 URL을 반환한다", () => {
    const url = trackingUrl("한진택배", "9876543210");
    expect(url).toContain("9876543210");
    expect(url).toContain("hanjin.com");
  });

  it("롯데택배 추적 URL을 반환한다", () => {
    const url = trackingUrl("롯데택배", "1111111111");
    expect(url).toContain("1111111111");
    expect(url).toContain("lotteglogis.com");
  });

  it("우체국택배 추적 URL을 반환한다", () => {
    const url = trackingUrl("우체국택배", "2222222222");
    expect(url).toContain("2222222222");
    expect(url).toContain("epost.go.kr");
  });

  it("알 수 없는 택배사 → null", () => {
    expect(trackingUrl("모름택배", "1234567890")).toBeNull();
  });

  it("courier가 null → null", () => {
    expect(trackingUrl(null, "1234567890")).toBeNull();
  });

  it("trackingNumber가 null → null", () => {
    expect(trackingUrl("CJ대한통운", null)).toBeNull();
  });

  it("둘 다 null → null", () => {
    expect(trackingUrl(null, null)).toBeNull();
  });
});
