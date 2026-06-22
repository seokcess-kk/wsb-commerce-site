"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_TYPE_LABEL, type RequestType } from "@/lib/orders/cancellation";

// 취소/교환/반품 신청 폼 — 서버 액션의 검증 에러·중복 차단 메시지를 사용자에게 표시한다.
export function CancellationRequestForm({
  orderNumber,
  allowedTypes,
  action,
}: {
  orderNumber: string;
  allowedTypes: RequestType[];
  action: (orderNumber: string, type: RequestType, reason: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [type, setType] = useState<RequestType>(allowedTypes[0]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (reason.trim().length < 5) {
      setError("사유를 5자 이상 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      const res = await action(orderNumber, type, reason.trim());
      if (res?.error) setError(res.error);
      else {
        setDone(true);
        setReason("");
        router.refresh();
      }
    });
  }

  if (done) {
    return (
      <p className="mt-3 rounded-lg border border-ng-cobalt/30 bg-ng-cobalt/5 px-4 py-3 text-sm text-ng-charcoal">
        요청이 접수되었습니다. 처리 결과는 위 ‘요청 내역’에서 확인하실 수 있습니다.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3" noValidate>
      {allowedTypes.length > 1 && (
        <div className="flex gap-3">
          {allowedTypes.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
              />
              {REQUEST_TYPE_LABEL[t]}
            </label>
          ))}
        </div>
      )}
      <label htmlFor="reason" className="block text-sm font-medium text-ng-charcoal">
        사유
      </label>
      <textarea
        id="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="사유를 입력해 주세요 (5자 이상)"
        minLength={5}
        rows={3}
        className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-ng-cobalt focus:ring-1 focus:ring-ng-cobalt"
      />
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ng-cobalt px-5 py-2 text-sm font-bold text-white transition hover:bg-ng-cobalt/90 disabled:opacity-50"
      >
        {pending ? "처리 중…" : allowedTypes.includes("cancel") ? "취소 신청" : "요청 접수"}
      </button>
    </form>
  );
}
