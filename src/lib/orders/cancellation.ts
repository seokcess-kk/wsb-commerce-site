export type RequestType = "cancel" | "exchange" | "return";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  cancel: "취소",
  exchange: "교환",
  return: "반품",
};

export function availableRequestTypes(status: string): RequestType[] {
  if (status === "paid" || status === "preparing") {
    return ["cancel"];
  }
  if (status === "shipped" || status === "delivered") {
    return ["exchange", "return"];
  }
  return [];
}

// --- 어드민 처리 상태 (운영자 승인/반려) ---
// 취소/반품 요청의 운영 처리 상태. requested(접수) → refunded(승인·환불완료) | rejected(반려).
export const ADMIN_CANCELLATION_STATUSES = ["requested", "refunded", "rejected"] as const;
export type AdminCancellationStatus = (typeof ADMIN_CANCELLATION_STATUSES)[number];

export const CANCELLATION_STATUS_LABEL: Record<AdminCancellationStatus, string> = {
  requested: "접수",
  refunded: "환불완료",
  rejected: "반려",
};

export function cancellationStatusLabel(status: string): string {
  return (CANCELLATION_STATUS_LABEL as Record<string, string>)[status] ?? status;
}

// 운영자가 옮길 수 있는 다음 상태. requested 만 처리 가능하며, 종료 상태는 전이 없음.
export function nextCancellationStatuses(current: string): ("refunded" | "rejected")[] {
  return current === "requested" ? ["refunded", "rejected"] : [];
}

// 처리(승인/반려) 가능 여부 — 멱등 가드의 1차 방어선.
export function canProcessCancellation(status: string): boolean {
  return status === "requested";
}

// v1 환불액: 전체취소만 지원하므로 주문 총액 전액. 부분취소/부분환불은 비범위.
export function refundAmount(order: { totalAmount: number }): number {
  return order.totalAmount;
}
