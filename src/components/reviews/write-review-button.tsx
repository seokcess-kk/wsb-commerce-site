"use client";

import { useState } from "react";
import { ReviewForm } from "./review-form";
import type { SubmitReviewInput } from "@/app/account/reviews/actions";

type Props = {
  orderId: string;
  productId: string;
  productName: string;
  onSubmit: (input: SubmitReviewInput) => Promise<{ error?: string }>;
};

export function WriteReviewButton({ orderId, productId, productName, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <span className="text-xs text-wsb-green font-medium">리뷰 등록 완료</span>;
  }

  return (
    <div>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-wsb-green px-3 py-1.5 text-xs font-semibold text-wsb-green hover:bg-wsb-green hover:text-white transition-colors"
        >
          리뷰 작성
        </button>
      )}
      {open && (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <ReviewForm
            orderId={orderId}
            productId={productId}
            productName={productName}
            onSubmit={onSubmit}
            onSuccess={() => setSubmitted(true)}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs text-stone-400 hover:text-stone-600"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
