"use client";
import { useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useCart } from "@/lib/cart/cart-context";
import { orderTotal, freeShippingProgress, shippingFee } from "@/lib/checkout/pricing";
import { formatKRW } from "@/lib/format";
import { getTossClientKey } from "@/lib/payments/toss";
import { isPaymentsEnabled } from "@/lib/payments/toggle";
import { PostcodeSearch } from "@/components/checkout/postcode-search";
import { AddressSelector } from "@/components/checkout/address-selector";
import { CouponField } from "@/components/checkout/coupon-field";
import { TermsAgreement } from "@/components/checkout/terms-agreement";
import type { CheckoutAddress } from "@/lib/account/address-types";

type Form = {
  name: string;
  phone: string;
  email: string;
  zipcode: string;
  address1: string;
  address2: string;
};

const FIELD_LABELS: Record<string, string> = {
  name: "이름",
  phone: "연락처",
  email: "이메일",
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  const [form, setForm] = useState<Form>({
    name: "",
    phone: "",
    email: "",
    zipcode: "",
    address1: "",
    address2: "",
  });

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined);
  const [allRequired, setAllRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const ship = shippingFee(Math.max(0, subtotal - couponDiscount));
  const total = orderTotal(subtotal, couponDiscount);
  const progress = freeShippingProgress(subtotal);
  const paymentsOn = isPaymentsEnabled(process.env.NEXT_PUBLIC_PAYMENTS_ENABLED);

  function handleAddressSelect(a: CheckoutAddress) {
    setForm((prev) => ({
      ...prev,
      zipcode: a.zipcode,
      address1: a.address1,
      address2: a.address2 ?? "",
      name: prev.name || a.recipient,
      phone: prev.phone || a.phone,
    }));
  }

  function handleCouponApply(discount: number, code: string) {
    setCouponDiscount(discount);
    setCouponCode(code);
  }

  async function pay() {
    if (!paymentsOn) return;
    if (!allRequired) return alert("필수 약관에 모두 동의해주세요.");
    if (!form.name || !form.phone || !form.email) return alert("주문자 정보를 모두 입력해주세요.");
    if (!form.zipcode || !form.address1) return alert("주소를 검색해주세요.");

    const address = [form.address1, form.address2].filter(Boolean).join(" ");

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            address,
            zipcode: form.zipcode,
          },
          couponCode,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "주문 생성 실패");

      const toss = await loadTossPayments(getTossClientKey());
      const payment = toss.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: order.amount },
        orderId: order.orderNumber,
        orderName: items[0]?.name ?? "WSB 주문",
        customerEmail: form.email,
        customerName: form.name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e) {
      alert((e as Error).message);
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-center text-stone-500">
        장바구니가 비어 있습니다.
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-extrabold text-wsb-carbon">주문서</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* ── 왼쪽: 주문자 정보 + 배송지 ── */}
        <div className="space-y-8">
          {/* 저장된 배송지 불러오기 */}
          <div>
            <AddressSelector onSelect={handleAddressSelect} />
          </div>

          {/* 주문자 정보 */}
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-bold text-wsb-carbon">주문자 정보</legend>
            {(["name", "phone", "email"] as const).map((f) => (
              <input
                key={f}
                placeholder={FIELD_LABELS[f]}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
              />
            ))}
          </fieldset>

          {/* 배송지 */}
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-bold text-wsb-carbon">배송지</legend>
            {/* 우편번호 행 */}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={form.zipcode}
                placeholder="우편번호"
                className="w-32 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
              />
              <PostcodeSearch
                onComplete={({ zipcode, address1 }) =>
                  setForm((prev) => ({ ...prev, zipcode, address1 }))
                }
              />
            </div>
            {/* 기본 주소 (검색 결과, 읽기 전용) */}
            <input
              readOnly
              value={form.address1}
              placeholder="기본 주소 (주소 검색 후 자동 입력)"
              className="w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
            />
            {/* 상세 주소 (사용자 입력) */}
            <input
              value={form.address2}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
              placeholder="상세 주소 (동/호수 등)"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
            />
          </fieldset>

          {/* 약관 동의 */}
          <TermsAgreement onRequiredChange={setAllRequired} />
        </div>

        {/* ── 오른쪽: 주문 요약 ── */}
        <aside className="h-fit space-y-6 rounded-lg border border-stone-200 p-5">
          {/* 상품 목록 */}
          <div>
            <h2 className="mb-3 text-sm font-bold text-wsb-carbon">주문 상품</h2>
            <ul className="divide-y divide-stone-100 text-sm">
              {items.map((it) => (
                <li key={it.variantId} className="flex justify-between py-2">
                  <span className="text-stone-700">
                    {it.name}
                    <span className="ml-1 text-stone-400">×{it.quantity}</span>
                  </span>
                  <span className="font-mono font-semibold">
                    {formatKRW(it.unitPrice * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 쿠폰 */}
          <CouponField subtotal={subtotal} onApply={handleCouponApply} />

          {/* 무료배송 프로그레스 */}
          {!progress.qualified && (
            <div className="space-y-1.5">
              <p className="text-xs text-stone-500">
                <span className="font-semibold text-wsb-green">
                  {formatKRW(progress.remaining)}
                </span>{" "}
                더 담으면 무료배송
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-wsb-green transition-all"
                  style={{
                    width: `${Math.min(100, ((subtotal / 50000) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
          {progress.qualified && (
            <p className="text-xs font-semibold text-wsb-green">무료배송 적용</p>
          )}

          {/* 가격 요약 */}
          <dl className="space-y-2 border-t border-stone-200 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">소계</dt>
              <dd className="font-mono">{formatKRW(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">할인</dt>
              <dd className="font-mono text-rose-600">
                {couponDiscount > 0 ? `−${formatKRW(couponDiscount)}` : "−"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">배송비</dt>
              <dd className="font-mono">{formatKRW(ship)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold">
              <dt>총액</dt>
              <dd className="font-mono">{formatKRW(total)}</dd>
            </div>
          </dl>

          {!paymentsOn && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              현재 온라인 결제를 준비 중입니다. 정식 오픈 시 결제가 가능합니다.
            </p>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={loading || !paymentsOn || !allRequired}
            className="w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
          >
            {!paymentsOn ? "결제 준비중" : loading ? "처리 중…" : "결제하기"}
          </button>
        </aside>
      </div>
    </section>
  );
}
