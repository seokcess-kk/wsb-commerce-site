"use client";
export function WishlistButton({ productId, initialActive = false }: { productId: string; initialActive?: boolean }) {
  return (
    <button type="button" data-product={productId} aria-pressed={initialActive} disabled className="text-stone-300">
      ♡
    </button>
  );
}
