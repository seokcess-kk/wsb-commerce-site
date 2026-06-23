"use client";

import { useState, useTransition } from "react";
import { deleteProduct } from "@/app/admin/products/actions";

// 상품 소프트 삭제(보관). 복원 UI가 아직 없으므로 한 단계 확인을 둔다.
export function ProductDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      {confirming ? (
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-md bg-[var(--ad-neg)] px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
          >
            {pending ? "처리 중…" : "삭제 확인"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded-md border border-[var(--ad-line)] px-2 py-1 text-xs font-semibold text-[var(--ad-mut)] disabled:opacity-50"
          >
            취소
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md border border-[var(--ad-neg)] px-2 py-1 text-xs font-semibold text-[var(--ad-neg)] hover:bg-[var(--ad-neg)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-neg)]"
        >
          삭제
        </button>
      )}
      {error && <span className="mt-1 max-w-[12rem] text-right text-[11px] text-[var(--ad-neg)]">{error}</span>}
    </span>
  );
}
