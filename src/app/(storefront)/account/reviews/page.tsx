import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listWritableOrderItems, listMyReviews } from "@/db/queries/reviews";
import { StarRating } from "@/components/reviews/star-rating";
import { WriteReviewButton } from "@/components/reviews/write-review-button";
import { formatDate } from "@/lib/format";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "리뷰 관리",
  robots: { index: false },
};

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/reviews");

  const [writableItems, myReviews] = await Promise.all([
    listWritableOrderItems(user.id),
    listMyReviews(user.id),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/account" className="text-sm text-ng-cobalt">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-ng-charcoal">리뷰 관리</h1>

      {/* Writable items */}
      <h2 className="mt-8 mb-3 text-lg font-bold text-ng-charcoal">작성 가능한 리뷰</h2>
      {writableItems.length === 0 ? (
        <div className="rounded-lg border border-stone-200 py-10 text-center">
          <p className="text-sm text-stone-400">작성 가능한 리뷰가 없습니다.</p>
          <p className="mt-1 text-xs text-stone-400">구매확정된 주문에만 리뷰를 작성할 수 있습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {writableItems.map((item) => (
            <li key={`${item.orderId}:${item.productId}`} className="p-4">
              <div className="flex items-start gap-3">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt={item.productName}
                    className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ng-charcoal truncate">{item.productName}</p>
                  <p className="text-xs text-stone-400">{item.variantName}</p>
                  <p className="mt-0.5 font-mono text-xs text-stone-400">주문 {item.orderNumber}</p>
                  <div className="mt-2">
                    <WriteReviewButton
                      orderId={item.orderId}
                      productId={item.productId}
                      productName={item.productName}
                      onSubmit={submitReview}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* My reviews */}
      <h2 className="mt-10 mb-3 text-lg font-bold text-ng-charcoal">내 리뷰</h2>
      {myReviews.length === 0 ? (
        <div className="rounded-lg border border-stone-200 py-10 text-center">
          <p className="text-sm text-stone-400">작성된 리뷰가 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {myReviews.map((review) => (
            <li key={review.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
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
                  {review.title && (
                    <p className="mt-1 text-sm font-medium text-ng-charcoal">{review.title}</p>
                  )}
                  <p className="mt-1 whitespace-pre-line text-sm text-stone-600 line-clamp-3">
                    {review.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
