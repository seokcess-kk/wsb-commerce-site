"use client";
export function CouponField({ subtotal, onApply }: { subtotal: number; onApply: (discount: number, code: string) => void }) {
  void subtotal;
  void onApply;
  return <div className="text-sm text-stone-400">쿠폰 적용 준비중</div>;
}
