"use client";
import { useCart } from "@/lib/cart/cart-context";

export function CartBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <span
      className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-ng-cobalt px-1 font-mono text-[10px] font-bold text-white"
      aria-label={`장바구니 ${count}개`}
    >
      {count}
    </span>
  );
}
