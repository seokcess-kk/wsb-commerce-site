export const ORDER_STATUSES = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "결제 대기", paid: "결제 완료", preparing: "배송 준비",
  shipped: "발송 완료", delivered: "배송 완료", cancelled: "취소",
};

export function statusLabel(status: string): string {
  return (STATUS_LABEL as Record<string, string>)[status] ?? status;
}

// 전진(fulfillment) 전이만 정의한다. 취소(cancelled)는 토스 환불·재고 원복이 동반돼야 하므로
// 일반 상태 변경 버튼이 아니라 환불 처리가 포함된 전용 취소 경로(cancelOrderAsAdmin / 취소·반품 승인)로만 수행한다.
export function nextStatuses(current: string): OrderStatus[] {
  switch (current) {
    case "paid": return ["preparing"];
    case "preparing": return ["shipped"];
    case "shipped": return ["delivered"];
    default: return [];
  }
}

// 환불을 동반한 취소가 가능한(=청구·재고차감이 이미 일어난) 상태.
export function isCancellableByAdmin(current: string): boolean {
  return current === "paid" || current === "preparing" || current === "shipped";
}
export function isValidTransition(from: string, to: string): boolean {
  return (nextStatuses(from) as string[]).includes(to);
}
