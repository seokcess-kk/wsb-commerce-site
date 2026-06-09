import Link from "next/link";
import type { CartItem } from "@/lib/cart/cart-logic";
import { formatKRW } from "@/lib/format";
import { shippingFee, orderTotal, freeShippingProgress, FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/pricing";

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
      <div className="py-20 text-center">
        <p className="text-stone-500">장바구니가 비어 있습니다.</p>
        <Link href="/products" className="mt-3 inline-block font-semibold text-wsb-green">상품 보러가기 →</Link>
      </div>
    );
  }
  const ship = shippingFee(subtotal);
  const progress = freeShippingProgress(subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-stone-200">
        {items.map((it) => (
          <li key={it.variantId} className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-wsb-carbon">{it.name}</p>
              <p className="font-mono text-xs text-stone-500">{formatKRW(it.unitPrice)}</p>
            </div>
            <input
              type="number" min={1} value={it.quantity}
              onChange={(e) => onSetQty(it.variantId, Number(e.target.value))}
              className="w-16 rounded border border-stone-300 px-2 py-1 text-sm"
              aria-label={`${it.name} 수량`}
            />
            <p className="w-24 text-right font-mono text-sm font-bold">{formatKRW(it.unitPrice * it.quantity)}</p>
            <button type="button" onClick={() => onRemove(it.variantId)} aria-label={`${it.name} 삭제`}
              className="text-stone-400 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green rounded-sm">✕</button>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-lg border border-stone-200 p-5">
        {/* 무료배송 프로그레스 */}
        {progress.qualified ? (
          <div className="mb-4 rounded-md bg-wsb-green/10 px-3 py-2 text-center text-xs font-semibold text-wsb-green">
            무료배송
          </div>
        ) : (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs text-stone-500">
              <span className="font-semibold text-wsb-green">{formatKRW(progress.remaining)}</span>
              {" "}더 담으면 무료배송
            </p>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="무료배송까지 진행률"
            >
              <div
                className="h-full rounded-full bg-wsb-green transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">소계</dt><dd className="font-mono">{formatKRW(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">배송비</dt><dd className="font-mono">{formatKRW(ship)}</dd></div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold"><dt>총액</dt><dd className="font-mono">{formatKRW(orderTotal(subtotal))}</dd></div>
        </dl>
        <Link href="/checkout" className="mt-4 block rounded-md bg-wsb-green py-3 text-center text-sm font-bold text-white">주문하기</Link>
      </aside>
    </div>
  );
}
