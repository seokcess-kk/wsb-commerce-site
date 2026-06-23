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
// 취소/반품 요청의 운영 처리 상태.
//   requested(접수) → refunded(환불완료) | resolved(처리완료·환불없음) | rejected(반려)
// refunded: 토스 환불이 발생한 승인(cancel/return). resolved: 환불 없이 접수만 마무리한 승인(exchange).
export const ADMIN_CANCELLATION_STATUSES = ["requested", "refunded", "resolved", "rejected"] as const;
export type AdminCancellationStatus = (typeof ADMIN_CANCELLATION_STATUSES)[number];

export const CANCELLATION_STATUS_LABEL: Record<AdminCancellationStatus, string> = {
  requested: "접수",
  refunded: "환불완료",
  resolved: "처리완료",
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

// --- 요청 타입별 '승인' 처리 정책 (표준안) ---
// 코드가 임의로 정할 수 없는 비즈니스 규칙을 한 곳에 모은 순수 함수(테스트 대상).
//   cancel  : 미출고 취소 → 전액환불 + 주문취소 + 재고원복(단, 실제 차감된 수량만)
//   return  : 출고 후 반품 → 전액환불 + 주문취소. 재고는 물품 회수·검수 후 운영자가 수동 입고(원복 X)
//   exchange: 출고 후 교환 → 환불 아님(동일상품 재발송). 주문 유지, 요청만 '처리완료(resolved)'로 마감
export type CancellationResolution = {
  refund: boolean; // 토스 전액환불 + payments.status='cancelled' 수행 여부
  cancelOrder: boolean; // orders.status='cancelled' 전이 여부
  restock: boolean; // 재고 원복 수행 여부(실제 차감분만)
  nextStatus: "refunded" | "resolved"; // 처리 후 cancellation 상태
};

export function resolveCancellation(type: string): CancellationResolution {
  switch (type) {
    case "cancel":
      return { refund: true, cancelOrder: true, restock: true, nextStatus: "refunded" };
    case "return":
      return { refund: true, cancelOrder: true, restock: false, nextStatus: "refunded" };
    case "exchange":
      return { refund: false, cancelOrder: false, restock: false, nextStatus: "resolved" };
    default:
      // 알 수 없는 타입은 보수적으로 환불 없이 마감(자금 보호).
      return { refund: false, cancelOrder: false, restock: false, nextStatus: "resolved" };
  }
}
