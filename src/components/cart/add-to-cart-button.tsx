"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import type { CartItem } from "@/lib/cart/cart-logic";

export function AddToCartButton({ options }: { options: Array<CartItem & { stock: number }> }) {
  const { add } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState(options[0]?.variantId ?? "");
  const [quantity, setQuantity] = useState(1);

  const opt = options.find((o) => o.variantId === selected);
  const soldOut = !opt || opt.stock <= 0;
  const maxQty = opt?.stock ?? 1;

  function handleVariantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelected(e.target.value);
    setQuantity(1); // reset qty when variant changes
  }

  function increment() {
    setQuantity((q) => Math.min(q + 1, maxQty));
  }

  function decrement() {
    setQuantity((q) => Math.max(q - 1, 1));
  }

  return (
    <div className="mt-4 space-y-2">
      <select
        value={selected}
        onChange={handleVariantChange}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt"
        aria-label="옵션 선택"
      >
        {options.map((o) => (
          <option key={o.variantId} value={o.variantId} disabled={o.stock <= 0}>
            {o.name}{o.stock <= 0 ? " (품절)" : ""}
          </option>
        ))}
      </select>

      {/* Quantity stepper */}
      {!soldOut && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1}
            aria-label="수량 감소"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt disabled:opacity-40"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            min={1}
            max={maxQty}
            readOnly
            aria-label="수량"
            className="h-8 w-14 rounded-md border border-stone-300 text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt"
          />
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= maxQty}
            aria-label="수량 증가"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={soldOut}
        aria-label={soldOut ? "품절" : "장바구니 담기"}
        onClick={() => {
          if (opt) {
            const { stock, ...item } = opt;
            add({ ...item, quantity });
            router.push("/cart");
          }
        }}
        className="w-full rounded-md bg-ng-cobalt py-3 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
      >
        {soldOut ? "품절" : "장바구니 담기"}
      </button>
    </div>
  );
}
