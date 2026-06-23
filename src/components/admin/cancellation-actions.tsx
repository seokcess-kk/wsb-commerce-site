"use client";

import { useState, useTransition } from "react";
import { approveCancellation, rejectCancellation } from "@/app/admin/orders/cancellations/actions";
import { resolveCancellation } from "@/lib/orders/cancellation";

export function CancellationActions({ id, type }: { id: string; type: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // 환불이 발생하는 타입(취소/반품)만 '승인·환불', 교환은 환불 없는 '승인'.
  const approveLabel = resolveCancellation(type).refund ? "승인·환불" : "승인";

  function onApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveCancellation(id);
      if (res?.error) setError(res.error);
    });
  }

  function onReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectCancellation(id, reason);
      if (res?.error) setError(res.error);
      else setRejecting(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={pending}
          className="rounded-md bg-[var(--ad-accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? "처리 중…" : approveLabel}
        </button>
        <button
          type="button"
          onClick={() => setRejecting((v) => !v)}
          disabled={pending}
          className="rounded-md border border-[var(--ad-line)] px-3 py-1.5 text-xs font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)] disabled:opacity-50"
        >
          반려
        </button>
      </div>
      {rejecting && (
        <div className="flex items-center gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="반려 사유(선택)"
            className="rounded-md border border-[var(--ad-line)] px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={onReject}
            disabled={pending}
            className="rounded-md bg-[var(--ad-ink)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            반려 확정
          </button>
        </div>
      )}
      {error && <p className="text-xs text-[var(--ad-neg)]">{error}</p>}
    </div>
  );
}
