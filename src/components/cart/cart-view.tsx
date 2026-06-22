import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import type { CartItem } from "@/lib/cart/cart-logic";
import { formatKRW } from "@/lib/format";
import { shippingFee, orderTotal, freeShippingProgress, FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/pricing";
import { CTAButton } from "@/components/ui/cta-button";

export function CartView({
  items, subtotal, onSetQty, onRemove,
}: {
  items: CartItem[];
  subtotal: number;
  onSetQty: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-ng-offwhite py-20 text-center">
        <p className="text-stone-500">장바구니가 비어 있습니다.</p>
        <div className="mt-4">
          <CTAButton href="/products" variant="primary" size="md">
            라인업 보러가기
          </CTAButton>
        </div>
      </div>
    );
  }
  const ship = shippingFee(subtotal);
  const progress = freeShippingProgress(subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const stepBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt disabled:opacity-40";

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div>
        <ul className="divide-y divide-stone-200">
          {items.map((it) => (
            <li key={it.variantId} className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ng-charcoal">{it.name}</p>
                <p className="font-mono text-xs text-stone-500">{formatKRW(it.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSetQty(it.variantId, Math.max(1, it.quantity - 1))}
                  disabled={it.quantity <= 1}
                  aria-label={`${it.name} 수량 감소`}
                  className={stepBtn}
                >
                  <Minus size={14} aria-hidden />
                </button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">{it.quantity}</span>
                <button
                  type="button"
                  onClick={() => onSetQty(it.variantId, it.quantity + 1)}
                  disabled={it.maxStock != null && it.quantity >= it.maxStock}
                  aria-label={`${it.name} 수량 증가`}
                  className={stepBtn}
                >
                  <Plus size={14} aria-hidden />
                </button>
              </div>
              <p className="w-24 text-right font-mono text-sm font-bold text-ng-charcoal">
                {formatKRW(it.unitPrice * it.quantity)}
              </p>
              <button
                type="button"
                onClick={() => onRemove(it.variantId)}
                aria-label={`${it.name} 삭제`}
                className="rounded-sm text-stone-400 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Link href="/products" className="text-sm font-semibold text-ng-cobalt hover:underline">
            ← 계속 쇼핑하기
          </Link>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-stone-200 p-5 lg:sticky lg:top-24">
        {progress.qualified ? (
          <div className="mb-4 rounded-full bg-ng-neon px-3 py-1.5 text-center font-mono text-xs font-bold text-ng-charcoal">
            무료배송 적용 중
          </div>
        ) : (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs text-stone-500">
              <span className="font-semibold text-ng-cobalt">{formatKRW(progress.remaining)}</span> 더 담으면 무료배송
            </p>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="무료배송까지 진행률"
            >
              <div className="h-full rounded-full bg-ng-cobalt transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">소계</dt>
            <dd className="font-mono">{formatKRW(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">배송비</dt>
            <dd className="font-mono">{formatKRW(ship)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold text-ng-charcoal">
            <dt>총액</dt>
            <dd className="font-mono">{formatKRW(orderTotal(subtotal))}</dd>
          </div>
        </dl>

        <CTAButton href="/checkout" variant="primary" size="lg" fullWidth className="mt-4">
          주문하기
        </CTAButton>
      </aside>
    </div>
  );
}
