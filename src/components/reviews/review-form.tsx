"use client";

import { useState, useTransition } from "react";
import { StarRating } from "./star-rating";
import type { SubmitReviewInput } from "@/app/(storefront)/account/reviews/actions";

export type ReviewFormProps = {
  orderId: string;
  productId: string;
  productName: string;
  onSubmit: (input: SubmitReviewInput) => Promise<{ error?: string }>;
  onSuccess?: () => void;
};

export function ReviewForm({
  orderId,
  productId,
  productName,
  onSubmit,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("별점을 선택해 주세요.");
      return;
    }
    if (body.trim().length < 5) {
      setError("리뷰 내용을 5자 이상 입력해 주세요.");
      return;
    }

    const images = imageUrl.trim()
      ? imageUrl.split(",").map((u) => u.trim()).filter(Boolean)
      : [];

    startTransition(async () => {
      const result = await onSubmit({ orderId, productId, rating, title: title || null, body, images });
      if (result?.error) {
        setError(result.error);
      } else {
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm font-semibold text-ng-charcoal">{productName}</p>

      {/* Star rating */}
      <div>
        <label className="mb-1 block text-xs text-stone-500">별점 *</label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="mb-1 block text-xs text-stone-500">
          제목 (선택)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="리뷰 제목을 입력해 주세요"
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-ng-cobalt focus:outline-none"
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="review-body" className="mb-1 block text-xs text-stone-500">
          내용 *
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="상품 사용 후기를 작성해 주세요 (5자 이상)"
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-ng-cobalt focus:outline-none"
        />
      </div>

      {/* Image URL(s) */}
      <div>
        <label htmlFor="review-images" className="mb-1 block text-xs text-stone-500">
          사진 URL (선택, 쉼표 구분)
        </label>
        <input
          id="review-images"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-ng-cobalt focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-ng-cobalt px-6 py-2.5 text-sm font-semibold text-white hover:bg-ng-cobalt/90 disabled:opacity-50"
      >
        {isPending ? "제출 중..." : "리뷰 등록"}
      </button>
    </form>
  );
}
