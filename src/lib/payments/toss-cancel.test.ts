import { describe, it, expect } from "vitest";
import { buildTossCancelRequest } from "./toss-cancel";

describe("buildTossCancelRequest", () => {
  it("paymentKey 로 취소 엔드포인트 URL을 만든다", () => {
    const req = buildTossCancelRequest("PAY_KEY_123", { cancelReason: "고객 변심" }, "secret_abc");
    expect(req.url).toBe("https://api.tosspayments.com/v1/payments/PAY_KEY_123/cancel");
  });

  it("시크릿키로 Basic 인증 헤더를 구성한다(`secret:` base64)", () => {
    const req = buildTossCancelRequest("k", { cancelReason: "r" }, "secret_abc");
    const expected = "Basic " + Buffer.from("secret_abc:").toString("base64");
    expect(req.headers.Authorization).toBe(expected);
    expect(req.headers["Content-Type"]).toBe("application/json");
  });

  it("바디에 취소 사유를 담는다", () => {
    const req = buildTossCancelRequest("k", { cancelReason: "단순 변심" }, "s");
    expect(JSON.parse(req.body)).toEqual({ cancelReason: "단순 변심" });
  });

  it("부분취소 금액이 주어지면 cancelAmount를 포함한다", () => {
    const req = buildTossCancelRequest("k", { cancelReason: "r", cancelAmount: 5000 }, "s");
    expect(JSON.parse(req.body)).toEqual({ cancelReason: "r", cancelAmount: 5000 });
  });
});
