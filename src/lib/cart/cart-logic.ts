export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  thumbnail: string | null;
  // 담을 당시의 재고 상한(선택). 있으면 수량을 이 값으로 캡해 oversell 을 1차 방어한다.
  // 과거 버전 localStorage 카트와 호환을 위해 optional — 없으면 캡하지 않는다.
  maxStock?: number;
};

// 수량을 최소 1 이상으로 보정하고, 재고 상한(max)이 주어지면 그 값으로 캡한다.
function capQuantity(quantity: number, max?: number): number {
  const q = Math.max(1, Math.floor(quantity));
  if (max == null) return q;
  return Math.min(q, Math.max(1, Math.floor(max)));
}

export function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find((c) => c.variantId === item.variantId);
  if (existing) {
    // 같은 옵션 재담기: 수량 합산하되 재고 상한으로 캡. 상한은 새로 담은 값으로 갱신(최신 재고 반영).
    const max = item.maxStock ?? existing.maxStock;
    return cart.map((c) =>
      c.variantId === item.variantId
        ? { ...c, quantity: capQuantity(c.quantity + item.quantity, max), maxStock: max }
        : c,
    );
  }
  return [...cart, { ...item, quantity: capQuantity(item.quantity, item.maxStock) }];
}

export function setQuantity(cart: CartItem[], variantId: string, quantity: number): CartItem[] {
  return cart.map((c) => (c.variantId === variantId ? { ...c, quantity: capQuantity(quantity, c.maxStock) } : c));
}

export function removeItem(cart: CartItem[], variantId: string): CartItem[] {
  return cart.filter((c) => c.variantId !== variantId);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.quantity, 0);
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
}
