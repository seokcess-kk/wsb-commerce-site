import { listProductReviews } from "@/db/queries/reviews";
import { ReviewListClient } from "./review-list-client";

export async function ReviewList({ productId }: { productId: string }) {
  const reviews = await listProductReviews(productId);
  return <ReviewListClient reviews={reviews} />;
}
