import type { CartItem } from "./cart-logic";

export type ReorderItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  thumbnail: string | null;
};

export function orderItemsToCartItems(items: ReorderItem[]): CartItem[] {
  return items.map((item) => ({
    variantId: item.variantId,
    productSlug: item.productSlug,
    name: `${item.productName} / ${item.variantName}`,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    thumbnail: item.thumbnail,
  }));
}
