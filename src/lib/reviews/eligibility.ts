import type { OrderStatus } from "@/lib/admin/order-status";

export function reviewKey(orderId: string, productId: string): string {
  return `${orderId}:${productId}`;
}

export function canReview(orderStatus: OrderStatus, alreadyReviewed: boolean): boolean {
  return orderStatus === "delivered" && !alreadyReviewed;
}
