"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { orderItemsToCartItems, type ReorderItem } from "@/lib/cart/reorder";

type Props = {
  items: ReorderItem[];
};

export function ReorderButton({ items }: Props) {
  const { add } = useCart();
  const router = useRouter();

  function handleReorder() {
    if (items.length === 0) {
      alert("재주문 가능한 상품이 없습니다.");
      return;
    }
    const cartItems = orderItemsToCartItems(items);
    for (const item of cartItems) {
      add(item);
    }
    router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      className="rounded-lg border border-wsb-green px-4 py-2 text-sm font-semibold text-wsb-green transition hover:bg-wsb-green hover:text-white"
    >
      재주문
    </button>
  );
}
