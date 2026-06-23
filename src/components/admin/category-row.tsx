"use client";

import { useState, useTransition } from "react";
import { updateCategory, deleteCategory } from "@/app/admin/categories/actions";
import { TD, ROW } from "@/components/admin/ui/data-table";

type Category = { id: string; slug: string; name: string; sortOrder: number; productCount: number };

const inputCls =
  "rounded-md border border-[var(--ad-line)] px-2 py-1 text-sm text-[var(--ad-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)]";

export function CategoryRow({ category }: { category: Category }) {
  const [name, setName] = useState(category.name);
  const [sortOrder, setSortOrder] = useState(category.sortOrder);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = name.trim() !== category.name || sortOrder !== category.sortOrder;

  function onSave() {
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("sortOrder", String(sortOrder));
    startTransition(async () => {
      try {
        await updateCategory(category.id, fd);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCategory(category.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <tr className={ROW}>
      <td className={TD}>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          aria-label="카테고리명"
          className={`${inputCls} w-40`}
        />
      </td>
      <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{category.slug}</td>
      <td className={`${TD} font-mono text-xs`}>{category.productCount}</td>
      <td className={TD}>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(Number(e.target.value));
            setSaved(false);
          }}
          aria-label="정렬 순서"
          className={`${inputCls} w-16`}
        />
      </td>
      <td className={`${TD} text-right`}>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={pending || !dirty}
              className="rounded-md border border-[var(--ad-accent)] px-2 py-1 text-xs font-semibold text-[var(--ad-accent)] hover:bg-[var(--ad-accent)]/5 disabled:opacity-40"
            >
              {pending ? "처리 중…" : saved && !dirty ? "저장됨" : "저장"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-md border border-[var(--ad-neg)] px-2 py-1 text-xs font-semibold text-[var(--ad-neg)] hover:bg-[var(--ad-neg)]/5 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
          {error && <span className="max-w-[18rem] text-right text-[11px] text-[var(--ad-neg)]">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
