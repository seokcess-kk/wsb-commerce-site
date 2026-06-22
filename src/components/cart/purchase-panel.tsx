"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { formatKRW } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/pricing";
import { CTAButton } from "@/components/ui/cta-button";

type Option = { variantId: string; label: string; unitPrice: number; stock: number };
type Alt = { slug: string; code: string; ko: string };

// PDP 구매 패널 — 옵션 단일화 + 수량 + 바로구매(직행)/담기(토스트·잔류) + 모바일 하단 고정 CTA.
export function PurchasePanel({
  productName,
  productSlug,
  thumbnail,
  options,
  alt = [],
}: {
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  options: Option[];
  alt?: Alt[];
}) {
  const { add } = useCart();
  const router = useRouter();
  const firstAvailable = options.find((o) => o.stock > 0) ?? options[0];
  const [selected, setSelected] = useState(firstAvailable?.variantId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const opt = options.find((o) => o.variantId === selected);
  const soldOut = !opt || opt.stock <= 0;
  const allSoldOut = options.every((o) => o.stock <= 0);
  const maxQty = opt?.stock ?? 1;
  const lineTotal = (opt?.unitPrice ?? 0) * quantity;
  const freeShip = lineTotal >= FREE_SHIPPING_THRESHOLD;

  function selectVariant(variantId: string) {
    setSelected(variantId);
    setQuantity(1);
  }

  function buildItem() {
    if (!opt) return null;
    return {
      variantId: opt.variantId,
      productSlug,
      name: `${productName} / ${opt.label}`,
      unitPrice: opt.unitPrice,
      quantity,
      thumbnail,
      maxStock: opt.stock,
    };
  }

  function buyNow() {
    const item = buildItem();
    if (!item) return;
    add(item);
    router.push("/checkout");
  }

  function addToCart() {
    const item = buildItem();
    if (!item) return;
    add(item);
    setToast("장바구니에 담았어요");
  }

  // 품절: 대체 추천 + 재입고 문의(고객지원 연결).
  if (allSoldOut) {
    return (
      <div className="mt-6 rounded-2xl border border-stone-200 bg-ng-offwhite p-5">
        <p className="font-bold text-ng-charcoal">현재 품절된 상품입니다</p>
        <p className="mt-1 text-sm text-stone-500">아래 라인업을 먼저 살펴보시거나 재입고를 문의해 주세요.</p>
        {alt.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {alt.map((a) => (
              <Link
                key={a.slug}
                href={`/products/${a.slug}`}
                className="rounded-full border border-ng-cobalt/20 px-4 py-2 text-sm font-semibold text-ng-cobalt transition-colors hover:bg-ng-cobalt/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
              >
                {a.code} {a.ko} →
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <CTAButton href="/support/inquiry" variant="outline" size="sm">
            재입고 문의하기
          </CTAButton>
        </div>
      </div>
    );
  }

  const ctas = (size: "md" | "lg") => (
    <>
      <CTAButton onClick={buyNow} variant="primary" size={size} fullWidth disabled={soldOut} aria-label="바로 구매하기">
        바로 구매하기
      </CTAButton>
      <CTAButton onClick={addToCart} variant="outline" size={size} fullWidth disabled={soldOut} aria-label="장바구니 담기">
        장바구니
      </CTAButton>
    </>
  );

  return (
    <div className="mt-6">
      {/* 옵션 칩 */}
      <p className="mb-2 text-sm font-bold text-ng-charcoal">옵션 선택</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="옵션 선택">
        {options.map((o) => {
          const isSel = o.variantId === selected;
          const out = o.stock <= 0;
          return (
            <button
              key={o.variantId}
              type="button"
              role="radio"
              aria-checked={isSel}
              disabled={out}
              onClick={() => selectVariant(o.variantId)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isSel
                  ? "border-ng-cobalt bg-ng-cobalt/5 ring-1 ring-ng-cobalt"
                  : "border-stone-300 hover:border-stone-400"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-ng-charcoal">
                {isSel && <Check size={15} className="text-ng-cobalt" aria-hidden />}
                {o.label}
                {out && <span className="text-stone-400">(품절)</span>}
              </span>
              <span className="font-mono font-semibold text-ng-charcoal">{formatKRW(o.unitPrice)}</span>
            </button>
          );
        })}
      </div>

      {/* 수량 */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-bold text-ng-charcoal">수량</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="수량 감소"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt disabled:opacity-40"
          >
            <Minus size={15} aria-hidden />
          </button>
          <span className="w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="수량 증가"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt disabled:opacity-40"
          >
            <Plus size={15} aria-hidden />
          </button>
        </div>
      </div>

      {/* 합계 + 배송 */}
      <div className="mt-4 flex items-end justify-between border-t border-stone-200 pt-4">
        <div>
          <p className="text-xs text-stone-500">선택 금액</p>
          {freeShip ? (
            <span className="mt-1 inline-block rounded-full bg-ng-neon px-2 py-0.5 font-mono text-[11px] font-bold text-ng-charcoal">
              무료배송
            </span>
          ) : (
            <p className="mt-1 text-[11px] text-stone-400">5만원 이상 무료배송 · 기본 배송비 3,000원</p>
          )}
        </div>
        <p className="text-2xl font-extrabold text-ng-charcoal">{formatKRW(lineTotal)}</p>
      </div>

      {/* CTA (데스크톱·기본) */}
      <div className="mt-4 flex gap-2">{ctas("lg")}</div>

      {/* 모바일 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] pt-2.5 backdrop-blur md:hidden">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-stone-500">{opt?.label}</span>
          <span className="text-base font-extrabold text-ng-charcoal">{formatKRW(lineTotal)}</span>
        </div>
        <div className="flex gap-2">{ctas("md")}</div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8" role="status">
          <div className="flex items-center gap-3 rounded-full bg-ng-charcoal px-5 py-3 text-sm font-semibold text-white shadow-lg">
            <Check size={16} className="text-ng-neon" aria-hidden />
            {toast}
            <Link href="/cart" className="ml-1 font-bold text-ng-neon underline-offset-2 hover:underline">
              장바구니 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
