"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { REVIEWS_TAG } from "@/db/queries/reviews";

// 리뷰가 속한 상품 PDP·목록을 무효화(숨김/복원/삭제가 즉시 반영되도록).
async function revalidateForReview(reviewId: string) {
  const db = getDb();
  const [row] = await db
    .select({ slug: schema.products.slug })
    .from(schema.reviews)
    .innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
    .where(eq(schema.reviews.id, reviewId))
    .limit(1);
  // 캐시된 리뷰 쿼리(getRatingSummary/listProductReviews) 무효화.
  revalidateTag(REVIEWS_TAG, "max");
  if (row?.slug) revalidatePath(`/products/${row.slug}`);
  revalidatePath("/admin/reviews");
}

async function setHidden(id: string, isHidden: boolean) {
  await requireAdmin();
  // 무효화에 필요한 slug를 갱신 전에 확보한다(삭제가 아니므로 후조회도 가능하지만 일관성 위해 선조회).
  await revalidateForReview(id);
  await getDb().update(schema.reviews).set({ isHidden }).where(eq(schema.reviews.id, id));
}

export async function hideReview(id: string) {
  await setHidden(id, true);
}

export async function unhideReview(id: string) {
  await setHidden(id, false);
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await revalidateForReview(id); // 삭제 전에 slug 확보·무효화
  await getDb().delete(schema.reviews).where(eq(schema.reviews.id, id));
  revalidatePath("/admin/reviews");
}
