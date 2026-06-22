"use client";

import { useState, useTransition } from "react";
import { cancelOrderAsAdmin } from "@/app/admin/orders/actions";

// 운영자 직접 주문 취소(환불 포함). 실수 방지를 위해 사유 입력 + 명시적 확인 단계를 둔다.
export function OrderCancelButton({ orderNumber }: { orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAsAdmin(orderNumber, reason);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--ad-neg)] px-3 py-2 text-sm font-semibold text-[var(--ad-neg)] hover:bg-[var(--ad-neg)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-neg)]"
      >
        주문 취소 (환불)
      </button>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--ad-neg)] bg-[var(--ad-neg)]/5 p-3">
      <p className="text-sm font-semibold text-[var(--ad-neg)]">주문을 취소하고 전액 환불합니다.</p>
      <p className="mt-1 text-xs text-[var(--ad-mut)]">토스 결제가 환불되고 재고가 원복됩니다. 되돌릴 수 없습니다.</p>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="취소 사유 (예: 품절, 고객요청)"
        className="mt-2 w-full rounded-md border border-[var(--ad-line)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-neg)]"
      />
      {error && <p className="mt-2 text-xs text-[var(--ad-neg)]">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-[var(--ad-neg)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-neg)] disabled:opacity-50"
        >
          {pending ? "환불 처리 중…" : "환불하고 취소"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          disabled={pending}
          className="rounded-md border border-[var(--ad-line)] px-3 py-2 text-sm text-[var(--ad-mut)] hover:bg-[var(--ad-line)]/20 disabled:opacity-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
