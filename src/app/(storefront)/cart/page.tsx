"use client";
import { useCart } from "@/lib/cart/cart-context";
import { CartView } from "@/components/cart/cart-view";

export default function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">장바구니</h1>
      <CartView items={items} subtotal={subtotal} onSetQty={setQty} onRemove={remove} />
    </section>
  );
}
