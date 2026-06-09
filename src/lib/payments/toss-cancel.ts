import { getTossSecretKey } from "./toss";

export type TossCancelInput = {
  cancelReason: string;
  // 부분취소 금액(원). 생략 시 전액 취소. v1 운영 화면은 전액 취소만 사용한다.
  cancelAmount?: number;
};

export type TossCancelRequest = {
  url: string;
  headers: { Authorization: string; "Content-Type": string };
  body: string;
};

// 토스 결제 취소 요청을 구성한다(순수). 인증/URL/바디 규약은 confirmTossPayment 과 동일.
export function buildTossCancelRequest(
  paymentKey: string,
  input: TossCancelInput,
  secretKey: string,
): TossCancelRequest {
  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const body: Record<string, unknown> = { cancelReason: input.cancelReason };
  if (input.cancelAmount != null) body.cancelAmount = input.cancelAmount;
  return {
    url: `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export type TossCancelResult = {
  paymentKey: string;
  status: string;
  cancels?: { cancelAmount: number; canceledAt?: string }[];
};

// 토스 결제 취소(환불). 성공 시 취소 결과를 반환, 실패 시 throw.
export async function cancelTossPayment(
  paymentKey: string,
  input: TossCancelInput,
): Promise<TossCancelResult> {
  const req = buildTossCancelRequest(paymentKey, input, getTossSecretKey());
  const res = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`토스 결제 취소 실패: ${data.code ?? res.status} ${data.message ?? ""}`);
  }
  return data as TossCancelResult;
}
