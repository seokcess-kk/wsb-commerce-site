"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import type { CartItem } from "@/lib/cart/cart-logic";

export function AddToCartButton({ options }: { options: Array<CartItem & { stock: number }> }) {
  const { add } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState(options[0]?.variantId ?? "");
  const opt = options.find((o) => o.variantId === selected);
  const soldOut = !opt || opt.stock <= 0;
  return (
    <div className="mt-4 space-y-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        aria-label="옵션 선택"
      >
        {options.map((o) => (
          <option key={o.variantId} value={o.variantId} disabled={o.stock <= 0}>
            {o.name}{o.stock <= 0 ? " (품절)" : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={soldOut}
        onClick={() => {
          if (opt) {
            const { stock, ...item } = opt;
            add(item);
            router.push("/cart");
          }
        }}
        className="w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
      >
        {soldOut ? "품절" : "장바구니 담기"}
      </button>
    </div>
  );
}
