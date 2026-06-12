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

// 토스 결제 객체(REST 응답)에서 우리가 쓰는 필드만 추린 타입.
// status: "DONE"(완료) | "WAITING_FOR_DEPOSIT"(가상계좌 입금 대기) | "CANCELED" 등.
export type TossPayment = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method?: string | null;
  approvedAt?: string | null;
  virtualAccount?: {
    accountNumber: string;
    bankCode: string;
    customerName?: string | null;
    dueDate?: string | null;
    expired?: boolean | null;
  } | null;
};

// 토스 결제 승인. 성공 시 토스 결제 객체를 반환, 실패 시 throw.
export async function confirmTossPayment(input: { paymentKey: string; orderId: string; amount: number }): Promise<TossPayment> {
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
  return data as TossPayment;
}

// orderId(= 우리 orderNumber)로 토스 결제 객체를 조회. 웹훅 본문을 신뢰하지 않고
// 입금 완료 여부·금액을 서버 대 서버로 재확인하는 데 쓴다.
export async function getTossPaymentByOrderId(orderId: string): Promise<TossPayment> {
  const secret = getTossSecretKey();
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch(`https://api.tosspayments.com/v1/payments/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`토스 결제 조회 실패: ${data.code ?? res.status} ${data.message ?? ""}`);
  }
  return data as TossPayment;
}
