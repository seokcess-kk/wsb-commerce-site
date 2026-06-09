import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type AdminReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  imageCount: number;
  isHidden: boolean;
  createdAt: Date;
  productName: string;
  productSlug: string;
  userId: string;
};

export type ReviewFilter = {
  productId?: string;
  rating?: number;
  hidden?: boolean;
};

// 어드민 리뷰 목록(상품명 조인, 필터, 페이지네이션). 숨김 포함 전체.
export async function listReviewsAdmin(
  filter: ReviewFilter = {},
  page = 1,
  pageSize = 30,
): Promise<{ rows: AdminReviewRow[]; total: number }> {
  const db = getDb();

  const conds: SQL[] = [];
  if (filter.productId) conds.push(eq(schema.reviews.productId, filter.productId));
  if (filter.rating != null) conds.push(eq(schema.reviews.rating, filter.rating));
  if (filter.hidden != null) conds.push(eq(schema.reviews.isHidden, filter.hidden));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      title: schema.reviews.title,
      body: schema.reviews.body,
      imageCount: sql<number>`coalesce(jsonb_array_length(${schema.reviews.images}), 0)::int`,
      isHidden: schema.reviews.isHidden,
      createdAt: schema.reviews.createdAt,
      productName: schema.products.name,
      productSlug: schema.products.slug,
      userId: schema.reviews.userId,
    })
    .from(schema.reviews)
    .innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
    .where(where)
    .orderBy(desc(schema.reviews.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [countRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.reviews)
    .where(where);

  return { rows, total: countRow?.c ?? 0 };
}
