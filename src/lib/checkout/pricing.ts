export const BASE_SHIPPING_FEE = 3000;
export const FREE_SHIPPING_THRESHOLD = 50000;

export function shippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE;
}

export function orderTotal(subtotal: number): number {
  return subtotal + shippingFee(subtotal);
}
