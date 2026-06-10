"use client";

import { useState, useTransition } from "react";
import { formatKRW } from "@/lib/format";
import { applyCouponAction, listAvailableCouponsAction } from "@/app/(storefront)/checkout/coupon-actions";
import { couponLabel } from "@/lib/coupons/coupon-label";
import type { UserCouponWithDetails } from "@/db/queries/coupons";

type Props = {
  subtotal: number;
  onApply: (discount: number, code: string) => void;
};

export function CouponField({ subtotal, onApply }: Props) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [error, setError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<UserCouponWithDetails[]>([]);
  const [couponListLoaded, setCouponListLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRelease() {
    setApplied(false);
    setAppliedCode("");
    setAppliedDiscount(0);
    setError("");
    setCode("");
    onApply(0, "");
  }

  function loadCouponList() {
    if (couponListLoaded) return;
    startTransition(async () => {
      const list = await listAvailableCouponsAction(subtotal);
      setAvailableCoupons(list);
      setCouponListLoaded(true);
    });
  }

  function applyCode(targetCode: string) {
    if (!targetCode.trim()) {
      setError("쿠폰 코드를 입력해 주세요.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await applyCouponAction(targetCode, subtotal);
      if (result.ok) {
        setApplied(true);
        setAppliedCode(result.code);
        setAppliedDiscount(result.discount);
        onApply(result.discount, result.code);
      } else {
        setError(result.reason);
      }
    });
  }

  if (applied) {
    return (
      <div className="rounded-md border border-wsb-green/30 bg-wsb-green/5 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-semibold text-wsb-green">{appliedCode}</span>
            <span className="ml-2 text-sm text-wsb-green font-bold">
              −{formatKRW(appliedDiscount)} 할인 적용
            </span>
          </div>
          <button
            type="button"
            onClick={handleRelease}
            className="ml-2 text-xs text-stone-400 underline hover:text-stone-600"
          >
            해제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-wsb-carbon">쿠폰</p>

      {/* Code input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onFocus={loadCouponList}
          placeholder="쿠폰 코드 입력"
          aria-label="쿠폰 코드"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm font-mono uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => applyCode(code)}
          className="rounded-md bg-wsb-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        >
          {isPending ? "…" : "적용"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}

      {/* Quick-apply buttons for claimed coupons */}
      {availableCoupons.length > 0 && (
        <ul className="space-y-1 pt-1">
          {availableCoupons.map((uc) => (
            <li key={uc.userCouponId}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => applyCode(uc.coupon.code)}
                className="flex w-full items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-xs hover:border-wsb-green/50 hover:bg-wsb-green/5 disabled:opacity-50 text-left"
              >
                <span className="font-semibold text-stone-700">{uc.coupon.name}</span>
                <span className="text-wsb-green font-bold">{couponLabel(uc.coupon)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Not-logged-in hint — only shown when list loaded but empty due to no auth */}
      {couponListLoaded && availableCoupons.length === 0 && (
        <p className="text-xs text-stone-400">
          보유 쿠폰이 없습니다. 코드를 직접 입력하거나{" "}
          <a href="/account/coupons" className="underline hover:text-wsb-green">
            쿠폰함
          </a>
          에서 등록하세요.
        </p>
      )}
    </div>
  );
}
