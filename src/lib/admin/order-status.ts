export const ORDER_STATUSES = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "결제 대기", paid: "결제 완료", preparing: "배송 준비",
  shipped: "발송 완료", delivered: "배송 완료", cancelled: "취소",
};

export function statusLabel(status: string): string {
  return (STATUS_LABEL as Record<string, string>)[status] ?? status;
}

export function nextStatuses(current: string): OrderStatus[] {
  switch (current) {
    case "paid": return ["preparing", "cancelled"];
    case "preparing": return ["shipped", "cancelled"];
    case "shipped": return ["delivered"];
    default: return [];
  }
}
export function isValidTransition(from: string, to: string): boolean {
  return (nextStatuses(from) as string[]).includes(to);
}
