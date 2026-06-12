"use client";
import { useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useCart } from "@/lib/cart/cart-context";
import { orderTotal, freeShippingProgress, shippingFee, FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/pricing";
import { formatKRW } from "@/lib/format";
import { getTossClientKey } from "@/lib/payments/toss";
import { isPaymentsEnabled } from "@/lib/payments/toggle";
import { PostcodeSearch } from "@/components/checkout/postcode-search";
import { AddressSelector } from "@/components/checkout/address-selector";
import { CouponField } from "@/components/checkout/coupon-field";
import { TermsAgreement } from "@/components/checkout/terms-agreement";
import { PaymentMethodSelector, type PayMethod } from "@/components/checkout/payment-method-selector";
import { CTAButton } from "@/components/ui/cta-button";
import type { CheckoutAddress } from "@/lib/account/address-types";

type Form = { name: string; phone: string; email: string; zipcode: string; address1: string; address2: string };
type FieldKey = "name" | "phone" | "email";

const FIELDS: { key: FieldKey; label: string; type: string; inputMode?: "text" | "tel" | "email" }[] = [
  { key: "name", label: "이름", type: "text" },
  { key: "phone", label: "연락처 (- 없이)", type: "tel", inputMode: "tel" },
  { key: "email", label: "이메일", type: "email", inputMode: "email" },
];

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  const [form, setForm] = useState<Form>({ name: "", phone: "", email: "", zipcode: "", address1: "", address2: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined);
  const [allRequired, setAllRequired] = useState(false);
  const [method, setMethod] = useState<PayMethod>("CARD");
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const addressRef = useRef<HTMLFieldSetElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);

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

  function setField(key: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "이름을 입력해 주세요.";
    if (!form.phone.trim()) e.phone = "연락처를 입력해 주세요.";
    else if (!/^[0-9-]{9,}$/.test(form.phone.trim())) e.phone = "연락처 형식을 확인해 주세요.";
    if (!form.email.trim()) e.email = "이메일을 입력해 주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "이메일 형식을 확인해 주세요.";
    if (!form.zipcode || !form.address1) e.address = "주소를 검색해 주세요.";
    if (!allRequired) e.terms = "필수 약관에 동의해 주세요.";
    return e;
  }

  function focusFirstError(e: Record<string, string>) {
    for (const k of ["name", "phone", "email"] as const) {
      if (e[k]) return inputRefs.current[k]?.focus();
    }
    if (e.address) return addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (e.terms) return termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function pay() {
    if (!paymentsOn) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      focusFirstError(e);
      return;
    }

    const address = [form.address1, form.address2].filter(Boolean).join(" ");
    const orderName =
      items.length > 1 ? `${items[0].name} 외 ${items.length - 1}건` : items[0]?.name ?? "NUTROGIN 주문";

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: { name: form.name, phone: form.phone, email: form.email, address, zipcode: form.zipcode },
          couponCode,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "주문 생성 실패");

      const toss = await loadTossPayments(getTossClientKey());
      const payment = toss.payment({ customerKey: ANONYMOUS });
      const base = {
        amount: { currency: "KRW" as const, value: order.amount },
        orderId: order.orderNumber,
        orderName,
        customerEmail: form.email,
        customerName: form.name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      };
      switch (method) {
        case "CARD":
          await payment.requestPayment({ ...base, method: "CARD" });
          break;
        case "TRANSFER":
          await payment.requestPayment({ ...base, method: "TRANSFER" });
          break;
        case "VIRTUAL_ACCOUNT":
          await payment.requestPayment({ ...base, method: "VIRTUAL_ACCOUNT" });
          break;
        case "MOBILE_PHONE":
          await payment.requestPayment({ ...base, method: "MOBILE_PHONE" });
          break;
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: (err as Error).message }));
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-stone-500">장바구니가 비어 있습니다.</p>
        <div className="mt-4">
          <CTAButton href="/products" variant="primary" size="md">
            라인업 보러가기
          </CTAButton>
        </div>
      </section>
    );
  }

  const inputCls = (key: string) =>
    `w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt ${
      errors[key] ? "border-rose-400" : "border-stone-300"
    }`;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 pb-28 md:pb-10">
      <h1 className="mb-8 text-2xl font-extrabold text-ng-charcoal">주문서</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* ── 왼쪽 ── */}
        <div className="space-y-8">
          <div>
            <AddressSelector onSelect={handleAddressSelect} />
          </div>

          {/* 주문자 정보 */}
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-bold text-ng-charcoal">주문자 정보</legend>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <input
                  ref={(el) => {
                    inputRefs.current[f.key] = el;
                  }}
                  type={f.type}
                  inputMode={f.inputMode}
                  placeholder={f.label}
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  aria-invalid={!!errors[f.key]}
                  aria-label={f.label}
                  className={inputCls(f.key)}
                />
                {errors[f.key] && <p className="mt-1 text-xs text-rose-600">{errors[f.key]}</p>}
              </div>
            ))}
          </fieldset>

          {/* 배송지 */}
          <fieldset ref={addressRef} className="space-y-3 scroll-mt-20">
            <legend className="mb-3 text-sm font-bold text-ng-charcoal">배송지</legend>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={form.zipcode}
                placeholder="우편번호"
                aria-label="우편번호"
                className="w-32 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
              />
              <PostcodeSearch
                onComplete={({ zipcode, address1 }) => {
                  setForm((prev) => ({ ...prev, zipcode, address1 }));
                  setErrors((prev) => (prev.address ? { ...prev, address: "" } : prev));
                }}
              />
            </div>
            <input
              readOnly
              value={form.address1}
              placeholder="기본 주소 (주소 검색 후 자동 입력)"
              aria-label="기본 주소"
              className="w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
            />
            <input
              value={form.address2}
              onChange={(e) => setField("address2", e.target.value)}
              placeholder="상세 주소 (동/호수 등)"
              aria-label="상세 주소"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt"
            />
            {errors.address && <p className="text-xs text-rose-600">{errors.address}</p>}
          </fieldset>

          {/* 결제수단 */}
          <PaymentMethodSelector value={method} onChange={setMethod} />

          {/* 약관 */}
          <div ref={termsRef} className="scroll-mt-20">
            <TermsAgreement onRequiredChange={setAllRequired} />
            {errors.terms && <p className="mt-1 text-xs text-rose-600">{errors.terms}</p>}
          </div>
        </div>

        {/* ── 오른쪽 요약 ── */}
        <aside className="h-fit space-y-6 rounded-2xl border border-stone-200 p-5 lg:sticky lg:top-24">
          <div>
            <h2 className="mb-3 text-sm font-bold text-ng-charcoal">주문 상품</h2>
            <ul className="divide-y divide-stone-100 text-sm">
              {items.map((it) => (
                <li key={it.variantId} className="flex justify-between gap-2 py-2">
                  <span className="min-w-0 truncate text-stone-700">
                    {it.name}
                    <span className="ml-1 text-stone-400">×{it.quantity}</span>
                  </span>
                  <span className="shrink-0 font-mono font-semibold">{formatKRW(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <CouponField subtotal={subtotal} onApply={(d, c) => { setCouponDiscount(d); setCouponCode(c); }} />

          {progress.qualified ? (
            <span className="inline-block rounded-full bg-ng-neon px-2.5 py-0.5 font-mono text-[11px] font-bold text-ng-charcoal">
              무료배송 적용
            </span>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-stone-500">
                <span className="font-semibold text-ng-cobalt">{formatKRW(progress.remaining)}</span> 더 담으면 무료배송
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-ng-cobalt transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <dl className="space-y-2 border-t border-stone-200 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">소계</dt>
              <dd className="font-mono">{formatKRW(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">할인</dt>
              <dd className="font-mono text-rose-600">{couponDiscount > 0 ? `−${formatKRW(couponDiscount)}` : "−"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">배송비</dt>
              <dd className="font-mono">{formatKRW(ship)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold text-ng-charcoal">
              <dt>총액</dt>
              <dd className="font-mono">{formatKRW(total)}</dd>
            </div>
          </dl>

          {!paymentsOn && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              현재 온라인 결제를 준비 중입니다. 정식 오픈 시 결제가 가능합니다.
            </p>
          )}
          {errors.submit && <p className="text-xs text-rose-600">{errors.submit}</p>}

          <CTAButton onClick={pay} variant="primary" size="lg" fullWidth disabled={loading || !paymentsOn}>
            {!paymentsOn ? "결제 준비중" : loading ? "처리 중…" : `${formatKRW(total)} 결제하기`}
          </CTAButton>
        </aside>
      </div>

      {/* 모바일 하단 고정 결제바 */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-stone-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] pt-2.5 backdrop-blur md:hidden">
        <div>
          <p className="text-[11px] text-stone-500">최종 결제 금액</p>
          <p className="text-lg font-extrabold text-ng-charcoal">{formatKRW(total)}</p>
        </div>
        <CTAButton onClick={pay} variant="primary" size="md" disabled={loading || !paymentsOn}>
          {!paymentsOn ? "결제 준비중" : loading ? "처리 중…" : "결제하기"}
        </CTAButton>
      </div>
    </section>
  );
}
