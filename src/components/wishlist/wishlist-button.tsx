"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/app/account/wishlist/actions";

export function WishlistButton({
  productId,
  initialActive = false,
}: {
  productId: string;
  initialActive?: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    const optimistic = !active;
    setActive(optimistic); // optimistic update

    startTransition(async () => {
      try {
        const result = await toggleWishlistAction(productId);
        if ("unauthorized" in result) {
          setActive(!optimistic); // roll back optimistic state
          router.push("/login");
          return;
        }
        setActive(result.active); // reconcile with server
      } catch {
        setActive(!optimistic); // rollback on error
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "찜 해제" : "찜하기"}
      className={`rounded-full p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-1 ${
        active
          ? "text-rose-500 hover:text-rose-600"
          : "text-stone-300 hover:text-stone-500"
      }`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
