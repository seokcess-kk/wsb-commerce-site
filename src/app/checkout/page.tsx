"use client";
import { useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useCart } from "@/lib/cart/cart-context";
import { orderTotal } from "@/lib/checkout/pricing";
import { formatKRW } from "@/lib/format";
import { getTossClientKey } from "@/lib/payments/toss";

const FIELD_LABELS = { name: "이름", phone: "연락처", email: "이메일", address: "주소" } as const;

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", agree: false });
  const [loading, setLoading] = useState(false);
  const total = orderTotal(subtotal);

  async function pay() {
    if (!form.agree) return alert("개인정보 수집·이용에 동의해주세요.");
    if (!form.name || !form.phone || !form.email || !form.address) return alert("주문자 정보를 모두 입력해주세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), customer: form }),
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
    return <section className="mx-auto max-w-3xl px-6 py-16 text-center text-stone-500">장바구니가 비어 있습니다.</section>;
  }
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">주문서</h1>
      <div className="space-y-3">
        {(["name", "phone", "email", "address"] as const).map((f) => (
          <input
            key={f}
            placeholder={FIELD_LABELS[f]}
            value={form[f]}
            onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
          />
        ))}
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
          개인정보 수집·이용에 동의합니다.
        </label>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="text-lg font-extrabold">결제 금액 {formatKRW(total)}</span>
        <button type="button" onClick={pay} disabled={loading}
          className="rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2">
          {loading ? "처리 중…" : "결제하기"}
        </button>
      </div>
    </section>
  );
}
