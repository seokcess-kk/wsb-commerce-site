"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDb, schema } from "@/db/index";
import { createReview, updateReview, deleteReview } from "@/db/queries/reviews";
import { canReview } from "@/lib/reviews/eligibility";
import { forbiddenPhraseMessage } from "@/lib/compliance/forbidden-phrases";
import type { OrderStatus } from "@/lib/admin/order-status";

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

  const { orderId, productId, rating, title, body } = input;
  // Normalise & sanitise images server-side: split comma-separated strings, trim, keep only https:// URLs
  const rawImages = Array.isArray(input.images) ? input.images : [];
  const images = rawImages
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [entry]))
    .map((s) => s.trim())
    .filter((s) => s.startsWith("https://"));

  if (!rating || rating < 1 || rating > 5) {
    return { error: "별점은 1~5 사이여야 합니다." };
  }
  if (!body || body.trim().length < 5) {
    return { error: "리뷰 내용을 5자 이상 입력해 주세요." };
  }

  // 건강기능식품 표시·광고 기준 — 질병·의약품·치료 효과 단정 표현 차단.
  const compliance = forbiddenPhraseMessage(`${title ?? ""} ${body}`);
  if (compliance) {
    return { error: compliance };
  }

  const db = getDb();

  // Server-side eligibility re-verification:
  // 1 & 2 are independent: run in parallel
  const [orderResult, orderItemResult] = await Promise.all([
    db
      .select({ id: schema.orders.id, status: schema.orders.status, userId: schema.orders.userId })
      .from(schema.orders)
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, user.id)))
      .limit(1),
    db
      .select({ id: schema.orderItems.id })
      .from(schema.orderItems)
      .where(
        and(
          eq(schema.orderItems.orderId, orderId),
          eq(schema.orderItems.productId, productId),
        ),
      )
      .limit(1),
  ]);

  const [order] = orderResult;
  const [orderItem] = orderItemResult;

  if (!order) {
    return { error: "주문을 찾을 수 없습니다." };
  }

  // 2. Verify the productId is actually a line item on this order (defense-in-depth)
  if (!orderItem) {
    return { error: "해당 주문에 없는 상품입니다." };
  }

  // 3. Check if review already exists for this order+product
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

  if (!canReview(order.status as OrderStatus, !!existing)) {
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

  // Look up the product slug server-side to revalidate the public PDP
  const [product] = await db
    .select({ slug: schema.products.slug })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);

  revalidatePath("/account/reviews");
  if (product?.slug) {
    revalidatePath(`/products/${product.slug}`);
  }

  return {};
}

// 정규화 + 컴플라이언스 검증을 공유하는 헬퍼(작성/수정 공통).
function sanitizeImages(images?: string[]): string[] {
  const raw = Array.isArray(images) ? images : [];
  return raw
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [entry]))
    .map((s) => String(s).trim())
    .filter((s) => s.startsWith("https://"));
}

export type UpdateReviewInput = {
  reviewId: string;
  rating: number;
  title?: string | null;
  body: string;
  images?: string[];
};

// 내 리뷰 수정 — 소유권은 updateReview 가 (id, userId) 로 가드한다. 작성과 동일한 검증·컴플라이언스 적용.
export async function updateReviewAction(input: UpdateReviewInput): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/reviews");

  const { reviewId, rating, title, body } = input;
  if (!rating || rating < 1 || rating > 5) return { error: "별점은 1~5 사이여야 합니다." };
  if (!body || body.trim().length < 5) return { error: "리뷰 내용을 5자 이상 입력해 주세요." };

  const compliance = forbiddenPhraseMessage(`${title ?? ""} ${body}`);
  if (compliance) return { error: compliance };

  const slug = await updateReview({
    id: reviewId,
    userId: user.id,
    rating,
    title: title ?? null,
    body,
    images: sanitizeImages(input.images),
  });
  if (slug === null) return { error: "리뷰를 수정할 수 없습니다." };

  revalidatePath("/account/reviews");
  revalidatePath(`/products/${slug}`);
  return {};
}

// 내 리뷰 삭제 — 소유권은 deleteReview 가 (id, userId) 로 가드한다.
export async function deleteReviewAction(reviewId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/reviews");

  const slug = await deleteReview(reviewId, user.id);
  if (slug === null) return { error: "리뷰를 삭제할 수 없습니다." };

  revalidatePath("/account/reviews");
  if (slug) revalidatePath(`/products/${slug}`);
  return {};
}
