export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  thumbnail: string | null;
};

export function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find((c) => c.variantId === item.variantId);
  if (existing) {
    return cart.map((c) => (c.variantId === item.variantId ? { ...c, quantity: c.quantity + item.quantity } : c));
  }
  return [...cart, item];
}

export function setQuantity(cart: CartItem[], variantId: string, quantity: number): CartItem[] {
  const q = Math.max(1, Math.floor(quantity));
  return cart.map((c) => (c.variantId === variantId ? { ...c, quantity: q } : c));
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
