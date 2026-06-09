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
        className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
      >
        삭제
      </button>
      {error && <span className="mt-1 max-w-[12rem] text-right text-[11px] text-rose-600">{error}</span>}
    </span>
  );
}
