"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCoupon, updateCoupon } from "@/app/admin/coupons/actions";
import { AdminInput, AdminSelect, AdminButton, AdminCheckbox } from "@/components/admin/ui/controls";

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
    <form onSubmit={onSubmit} className="rounded-lg border border-[var(--ad-line)] p-4">
      <h2 className="mb-3 font-semibold text-[var(--ad-ink)]">{initial ? "쿠폰 수정" : "새 쿠폰 발급"}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          코드 <span className="text-xs text-[var(--ad-accent)]">필수</span>
          <AdminInput name="code" required defaultValue={initial?.code} placeholder="WELCOME10" />
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          이름 <span className="text-xs text-[var(--ad-accent)]">필수</span>
          <AdminInput name="name" required defaultValue={initial?.name} placeholder="신규 가입 쿠폰" />
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          할인 유형
          <AdminSelect name="discountType" defaultValue={initial?.discountType ?? "rate"}>
            <option value="rate">정률(%)</option>
            <option value="amount">정액(원)</option>
          </AdminSelect>
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          할인 값
          <AdminInput name="discountValue" type="number" required defaultValue={initial?.discountValue ?? 10} />
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          최소 주문금액(원)
          <AdminInput name="minSubtotal" type="number" defaultValue={initial?.minSubtotal ?? 0} />
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          최대 할인금액(원, 선택)
          <AdminInput name="maxDiscount" type="number" defaultValue={initial?.maxDiscount ?? ""} placeholder="제한 없음" />
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          시작일(선택)
          <AdminInput name="startsAt" type="datetime-local" defaultValue={toLocalInput(initial?.startsAt ?? null)} />
        </label>
        <label className="flex flex-col text-sm text-[var(--ad-mut)]">
          종료일(선택)
          <AdminInput name="endsAt" type="datetime-local" defaultValue={toLocalInput(initial?.endsAt ?? null)} />
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm text-[var(--ad-mut)]">
          <AdminCheckbox name="isActive" defaultChecked={initial ? initial.isActive : true} />
          활성
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-[var(--ad-neg)]">{error}</p>}
      <AdminButton type="submit" disabled={pending} className="mt-3">
        {pending ? "저장 중…" : initial ? "수정 저장" : "쿠폰 생성"}
      </AdminButton>
    </form>
  );
}
