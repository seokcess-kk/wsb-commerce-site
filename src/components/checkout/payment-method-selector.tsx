"use client";

// 결제수단 — 토스 SDK v2 `payment().requestPayment()` 의 method 코드와 1:1 대응.
// 가상계좌는 승인 시점에 WAITING_FOR_DEPOSIT 로 떨어지며, 실제 입금은
// /api/webhooks/toss(DEPOSIT_CALLBACK)가 받아 정산한다.
export const PAYMENT_METHODS = [
  { code: "CARD", label: "카드", hint: "신용·체크·간편결제" },
  { code: "TRANSFER", label: "계좌이체", hint: "실시간 계좌이체" },
  { code: "VIRTUAL_ACCOUNT", label: "가상계좌", hint: "무통장 입금" },
  { code: "MOBILE_PHONE", label: "휴대폰", hint: "통신사 결제" },
] as const;

export type PayMethod = (typeof PAYMENT_METHODS)[number]["code"];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PayMethod;
  onChange: (method: PayMethod) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-ng-charcoal">결제수단</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="결제수단 선택">
        {PAYMENT_METHODS.map((m) => {
          const selected = m.code === value;
          return (
            <label
              key={m.code}
              className={`flex cursor-pointer flex-col rounded-md border px-3 py-2.5 text-sm transition-colors ${
                selected
                  ? "border-ng-cobalt bg-ng-cobalt/5 ring-1 ring-ng-cobalt"
                  : "border-stone-300 hover:border-stone-400"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value={m.code}
                checked={selected}
                onChange={() => onChange(m.code)}
                className="sr-only"
              />
              <span className={`font-semibold ${selected ? "text-ng-cobalt" : "text-ng-charcoal"}`}>
                {m.label}
              </span>
              <span className="mt-0.5 text-xs text-stone-400">{m.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
