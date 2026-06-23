"use client";

import { useState, useTransition } from "react";
import { updateVariantStock } from "@/app/admin/products/actions";
import type { AdminVariantStock } from "@/db/queries/admin-products";

// 상품 목록에서 옵션(variant)별 재고를 인라인으로 빠르게 수정. 값 변경 후 Enter 또는 저장 버튼.
export function StockQuickEdit({ variants }: { variants: AdminVariantStock[] }) {
  if (variants.length === 0) {
    return <span className="text-xs text-[var(--ad-mut-2)]">옵션 없음</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {variants.map((v) => (
        <StockField key={v.id} variant={v} />
      ))}
    </div>
  );
}

function StockField({ variant }: { variant: AdminVariantStock }) {
  const [stock, setStock] = useState(variant.stock);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = stock !== variant.stock;

  function save() {
    if (!dirty || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await updateVariantStock(variant.id, stock);
      if (res?.error) setError(res.error);
    });
  }

  // 현재(서버) 재고 기준 색: 품절(빨강)/임박(주황)/정상.
  const tone =
    variant.stock <= 0
      ? "border-[var(--ad-neg)] text-[var(--ad-neg)]"
      : variant.stock < 10
        ? "border-amber-400 text-amber-600"
        : "border-[var(--ad-line)] text-[var(--ad-ink)]";

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-14 truncate text-[11px] text-[var(--ad-mut)]" title={variant.name}>
        {variant.name}
      </span>
      <input
        type="number"
        min={0}
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        aria-label={`${variant.name} 재고`}
        className={`w-16 rounded-md border px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] ${tone}`}
      />
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded bg-[var(--ad-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "…" : "저장"}
        </button>
      )}
      {error && <span className="text-[10px] text-[var(--ad-neg)]">{error}</span>}
    </div>
  );
}
