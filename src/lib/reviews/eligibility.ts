export function reviewKey(orderId: string, productId: string): string {
  return `${orderId}:${productId}`;
}

export function canReview(orderStatus: string, alreadyReviewed: boolean): boolean {
  return orderStatus === "delivered" && !alreadyReviewed;
}
