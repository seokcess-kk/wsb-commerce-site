"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { StarRating } from "./star-rating";
import { formatDate } from "@/lib/format";
import type { UpdateReviewInput } from "@/app/(storefront)/account/reviews/actions";

export type MyReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  createdAt: Date | string;
  productName: string;
  productSlug: string;
};

// 내 리뷰 한 건 — 보기/수정/삭제. 작성과 동일한 클라이언트 검증 후 서버 액션 호출.
export function EditableReviewItem({
  review,
  onUpdate,
  onDelete,
}: {
  review: MyReview;
  onUpdate: (input: UpdateReviewInput) => Promise<{ error?: string }>;
  onDelete: (reviewId: string) => Promise<{ error?: string }>;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title ?? "");
  const [body, setBody] = useState(review.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    if (rating === 0) { setError("별점을 선택해 주세요."); return; }
    if (body.trim().length < 5) { setError("리뷰 내용을 5자 이상 입력해 주세요."); return; }
    startTransition(async () => {
      const r = await onUpdate({ reviewId: review.id, rating, title: title || null, body, images: review.images });
      if (r?.error) setError(r.error);
      else setMode("view");
    });
  }

  function del() {
    setError(null);
    startTransition(async () => {
      const r = await onDelete(review.id);
      if (r?.error) { setError(r.error); setConfirmDelete(false); }
      // 성공 시 revalidate 로 목록에서 사라짐.
    });
  }

  if (mode === "edit") {
    return (
      <li className="p-4">
        <p className="text-sm font-semibold text-ng-charcoal">{review.productName}</p>
        <div className="mt-2">
          <label className="mb-1 block text-xs text-stone-500">별점 *</label>
          <StarRating value={rating} onChange={setRating} size={26} />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="제목 (선택)"
          className="mt-3 w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-ng-cobalt focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="내용 (5자 이상)"
          className="mt-2 w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-ng-cobalt focus:outline-none"
        />
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-full bg-ng-cobalt px-5 py-2 text-sm font-semibold text-white hover:bg-ng-cobalt/90 disabled:opacity-50"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("view"); setError(null); setRating(review.rating); setTitle(review.title ?? ""); setBody(review.body); }}
            disabled={pending}
            className="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-500 hover:bg-stone-50 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/products/${review.productSlug}`}
            className="text-sm font-semibold text-ng-charcoal hover:text-ng-cobalt hover:underline"
          >
            {review.productName}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={review.rating} size={14} />
            <time className="text-xs text-stone-400" dateTime={new Date(review.createdAt).toISOString()}>
              {formatDate(review.createdAt)}
            </time>
          </div>
          {review.title && <p className="mt-1 text-sm font-medium text-ng-charcoal">{review.title}</p>}
          <p className="mt-1 whitespace-pre-line text-sm text-stone-600 line-clamp-3">{review.body}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"
          >
            수정
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              삭제
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={del}
                disabled={pending}
                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {pending ? "삭제 중…" : "삭제 확인"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-50"
              >
                취소
              </button>
            </span>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}
