"use client";

import { useState, useTransition } from "react";
import { claimCouponAction } from "./actions";

export function CouponRegisterForm() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setMessage({ ok: false, text: "쿠폰 코드를 입력해 주세요." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await claimCouponAction(trimmed);
      if (result.ok) {
        setMessage({ ok: true, text: "쿠폰이 등록되었습니다." });
        setCode("");
      } else {
        setMessage({ ok: false, text: result.reason });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="쿠폰 코드 입력"
          aria-label="쿠폰 코드"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm font-mono uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-wsb-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        >
          {isPending ? "…" : "등록"}
        </button>
      </div>
      {message && (
        <p
          role="alert"
          className={`text-xs ${message.ok ? "text-wsb-green font-semibold" : "text-rose-600"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
