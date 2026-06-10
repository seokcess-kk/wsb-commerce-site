"use client";

import { useState, useTransition } from "react";
import { deleteCoupon } from "@/app/admin/coupons/actions";

export function CouponDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCoupon(id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md border border-[var(--ad-neg)] px-2 py-1 text-xs font-semibold text-[var(--ad-neg)] hover:bg-[var(--ad-neg)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-neg)] disabled:opacity-50"
      >
        삭제
      </button>
      {error && <span className="mt-1 max-w-[12rem] text-right text-[11px] text-[var(--ad-neg)]">{error}</span>}
    </span>
  );
}
