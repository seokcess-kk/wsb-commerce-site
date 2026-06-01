import { getEnv } from "@/lib/env";

export function getTossClientKey(): string {
  const key = getEnv().NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되지 않았습니다.");
  return key;
}

export function getTossSecretKey(): string {
  const key = getEnv().TOSS_SECRET_KEY;
  if (!key) throw new Error("TOSS_SECRET_KEY 가 설정되지 않았습니다.");
  return key;
}

// 토스 결제 승인. 성공 시 토스 결제 객체를 반환, 실패 시 throw.
export async function confirmTossPayment(input: { paymentKey: string; orderId: string; amount: number }) {
  const secret = getTossSecretKey();
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`토스 결제 승인 실패: ${data.code ?? res.status} ${data.message ?? ""}`);
  }
  return data as { paymentKey: string; orderId: string; status: string; totalAmount: number; method?: string; approvedAt?: string };
}
