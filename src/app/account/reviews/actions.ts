"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDb, schema } from "@/db/index";
import { createReview } from "@/db/queries/reviews";
import { canReview } from "@/lib/reviews/eligibility";

export type SubmitReviewInput = {
  orderId: string;
  productId: string;
  rating: number;
  title?: string | null;
  body: string;
  images?: string[];
};

export async function submitReview(
  input: SubmitReviewInput,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/reviews");

  const { orderId, productId, rating, title, body, images } = input;

  if (!rating || rating < 1 || rating > 5) {
    return { error: "별점은 1~5 사이여야 합니다." };
  }
  if (!body || body.trim().length < 5) {
    return { error: "리뷰 내용을 5자 이상 입력해 주세요." };
  }

  const db = getDb();

  // Server-side eligibility re-verification:
  // 1. The order belongs to this user and has status "delivered"
  const [order] = await db
    .select({ id: schema.orders.id, status: schema.orders.status, userId: schema.orders.userId })
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, user.id)))
    .limit(1);

  if (!order) {
    return { error: "주문을 찾을 수 없습니다." };
  }

  // 2. Check if review already exists for this order+product
  const [existing] = await db
    .select({ id: schema.reviews.id })
    .from(schema.reviews)
    .where(
      and(
        eq(schema.reviews.orderId, orderId),
        eq(schema.reviews.productId, productId),
      ),
    )
    .limit(1);

  if (!canReview(order.status, !!existing)) {
    if (existing) return { error: "이미 작성된 리뷰입니다." };
    return { error: "구매확정된 주문에만 리뷰를 작성할 수 있습니다." };
  }

  const inserted = await createReview({
    userId: user.id,
    orderId,
    productId,
    rating,
    title: title ?? null,
    body,
    images: images ?? [],
  });

  if (!inserted) {
    return { error: "이미 작성된 리뷰입니다." };
  }

  revalidatePath("/account/reviews");

  return {};
}
