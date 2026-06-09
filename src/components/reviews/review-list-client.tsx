"use client";

import { useState } from "react";
import { StarRating } from "./star-rating";
import type { ReviewRow } from "@/db/queries/reviews";
import { formatDate } from "@/lib/format";

type SortKey = "newest" | "highest";

export function ReviewListClient({ reviews }: { reviews: ReviewRow[] }) {
  const [sort, setSort] = useState<SortKey>("newest");

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    // newest: compare dates
    const tA = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : a.createdAt.getTime();
    const tB = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : b.createdAt.getTime();
    return tB - tA;
  });

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-stone-400">아직 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex gap-2" role="group" aria-label="리뷰 정렬">
        {(["newest", "highest"] as SortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            aria-pressed={sort === key}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              sort === key
                ? "border-wsb-green bg-wsb-green text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-wsb-green"
            }`}
          >
            {key === "newest" ? "최신순" : "높은 별점순"}
          </button>
        ))}
      </div>

      {/* Review list */}
      <ul className="divide-y divide-stone-100" aria-label="리뷰 목록">
        {sorted.map((review) => (
          <li key={review.id} className="py-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} size={16} />
                  <span className="text-xs text-stone-400">{review.maskedAuthor}</span>
                  <time className="text-xs text-stone-400" dateTime={new Date(review.createdAt).toISOString()}>
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                {review.title && (
                  <p className="text-sm font-semibold text-wsb-carbon">{review.title}</p>
                )}
                <p className="whitespace-pre-line text-sm text-stone-700">{review.body}</p>
              </div>
            </div>

            {/* Image thumbnails */}
            {review.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2" aria-label="리뷰 사진">
                {review.images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`리뷰 사진 ${i + 1}`}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
