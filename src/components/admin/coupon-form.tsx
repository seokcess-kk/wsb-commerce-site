"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCoupon, updateCoupon } from "@/app/admin/coupons/actions";

export type CouponFormInitial = {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

// datetime-local 입력용 포맷(YYYY-MM-DDTHH:mm, 로컬 기준).
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputCls =
  "mt-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";

export function CouponForm({ initial }: { initial?: CouponFormInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = initial
        ? await updateCoupon(initial.id, formData)
        : await createCoupon(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (initial) {
        router.push("/admin/coupons");
      } else {
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-stone-200 p-4">
      <h2 className="mb-3 font-semibold text-wsb-carbon">{initial ? "쿠폰 수정" : "새 쿠폰 발급"}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <label className="flex flex-col text-sm text-stone-600">
          코드 <span className="text-xs text-wsb-green">필수</span>
          <input name="code" required defaultValue={initial?.code} placeholder="WELCOME10" className={inputCls} />
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          이름 <span className="text-xs text-wsb-green">필수</span>
          <input name="name" required defaultValue={initial?.name} placeholder="신규 가입 쿠폰" className={inputCls} />
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          할인 유형
          <select name="discountType" defaultValue={initial?.discountType ?? "rate"} className={inputCls}>
            <option value="rate">정률(%)</option>
            <option value="amount">정액(원)</option>
          </select>
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          할인 값
          <input name="discountValue" type="number" required defaultValue={initial?.discountValue ?? 10} className={inputCls} />
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          최소 주문금액(원)
          <input name="minSubtotal" type="number" defaultValue={initial?.minSubtotal ?? 0} className={inputCls} />
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          최대 할인금액(원, 선택)
          <input name="maxDiscount" type="number" defaultValue={initial?.maxDiscount ?? ""} placeholder="제한 없음" className={inputCls} />
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          시작일(선택)
          <input name="startsAt" type="datetime-local" defaultValue={toLocalInput(initial?.startsAt ?? null)} className={inputCls} />
        </label>
        <label className="flex flex-col text-sm text-stone-600">
          종료일(선택)
          <input name="endsAt" type="datetime-local" defaultValue={toLocalInput(initial?.endsAt ?? null)} className={inputCls} />
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm text-stone-600">
          <input name="isActive" type="checkbox" defaultChecked={initial ? initial.isActive : true} className="size-4" />
          활성
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-md bg-wsb-green px-4 py-2 text-sm font-bold text-white hover:bg-wsb-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {pending ? "저장 중…" : initial ? "수정 저장" : "쿠폰 생성"}
      </button>
    </form>
  );
}
