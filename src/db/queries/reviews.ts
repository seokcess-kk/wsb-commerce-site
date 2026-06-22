import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  createdAt: Date;
  maskedAuthor: string;
};

export type RatingSummary = {
  count: number;
  average: number;
};

export type WritableOrderItem = {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  variantName: string;
  productSlug: string;
  thumbnail: string | null;
};

export type MyReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  createdAt: Date;
  productName: string;
  productSlug: string;
};

/**
 * Mask userId to a privacy-safe display label.
 * e.g. "회원 a1b2c3" (first 6 hex chars of the UUID).
 */
function maskUserId(userId: string): string {
  const short = userId.replace(/-/g, "").slice(0, 6);
  return `회원 ${short}`;
}

export async function listProductReviews(productId: string): Promise<ReviewRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      title: schema.reviews.title,
      body: schema.reviews.body,
      images: schema.reviews.images,
      createdAt: schema.reviews.createdAt,
      userId: schema.reviews.userId,
    })
    .from(schema.reviews)
    .where(and(eq(schema.reviews.productId, productId), eq(schema.reviews.isHidden, false)))
    .orderBy(desc(schema.reviews.createdAt));

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    images: r.images,
    createdAt: r.createdAt,
    maskedAuthor: maskUserId(r.userId),
  }));
}

export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  const db = getDb();
  const [row] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      avg: sql<number>`COALESCE(AVG(${schema.reviews.rating}), 0)`,
    })
    .from(schema.reviews)
    .where(and(eq(schema.reviews.productId, productId), eq(schema.reviews.isHidden, false)));

  if (!row || row.count === 0) return { count: 0, average: 0 };
  return { count: row.count, average: Math.round(row.avg * 10) / 10 };
}

export type CreateReviewInput = {
  userId: string;
  orderId: string;
  productId: string;
  rating: number;
  title?: string | null;
  body: string;
  images?: string[];
};

/**
 * Insert a review; relies on unique(orderId, productId) constraint.
 * Returns true if inserted, false if a review for this order+product already exists.
 */
export async function createReview(input: CreateReviewInput): Promise<boolean> {
  const db = getDb();
  const result = await db
    .insert(schema.reviews)
    .values({
      userId: input.userId,
      orderId: input.orderId,
      productId: input.productId,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      images: input.images ?? [],
    })
    .onConflictDoNothing()
    .returning({ id: schema.reviews.id });

  return result.length > 0;
}

export type UpdateReviewInput = {
  id: string;
  userId: string;
  rating: number;
  title?: string | null;
  body: string;
  images?: string[];
};

/**
 * Update a review the user owns. Guarded by (id, userId) so users can only
 * edit their own. Returns the product slug for PDP revalidation, or null if
 * no matching row was updated (not found / not owner).
 */
export async function updateReview(input: UpdateReviewInput): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .update(schema.reviews)
    .set({
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      images: input.images ?? [],
    })
    .where(and(eq(schema.reviews.id, input.id), eq(schema.reviews.userId, input.userId)))
    .returning({ productId: schema.reviews.productId });
  if (!row) return null;
  const [product] = await db
    .select({ slug: schema.products.slug })
    .from(schema.products)
    .where(eq(schema.products.id, row.productId))
    .limit(1);
  return product?.slug ?? null;
}

/**
 * Delete a review the user owns. Guarded by (id, userId). Returns the product
 * slug for PDP revalidation, or null if nothing was deleted.
 */
export async function deleteReview(id: string, userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .delete(schema.reviews)
    .where(and(eq(schema.reviews.id, id), eq(schema.reviews.userId, userId)))
    .returning({ productId: schema.reviews.productId });
  if (!row) return null;
  const [product] = await db
    .select({ slug: schema.products.slug })
    .from(schema.products)
    .where(eq(schema.products.id, row.productId))
    .limit(1);
  return product?.slug ?? null;
}

/**
 * Items from the user's delivered orders that do not yet have a review.
 */
export async function listWritableOrderItems(userId: string): Promise<WritableOrderItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      orderId: schema.orderItems.orderId,
      orderNumber: schema.orders.orderNumber,
      productId: schema.orderItems.productId,
      productName: schema.orderItems.productName,
      variantName: schema.orderItems.variantName,
      productSlug: schema.products.slug,
      thumbnail: sql<string | null>`(${schema.products.images}->>0)`,
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
    .leftJoin(
      schema.reviews,
      and(
        eq(schema.reviews.orderId, schema.orderItems.orderId),
        eq(schema.reviews.productId, schema.orderItems.productId),
      ),
    )
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orders.status, "delivered"),
        isNull(schema.reviews.id),
      ),
    )
    .orderBy(desc(schema.orders.createdAt));

  return rows;
}

/**
 * The user's own reviews joined with product name/slug.
 */
export async function listMyReviews(userId: string): Promise<MyReviewRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      title: schema.reviews.title,
      body: schema.reviews.body,
      images: schema.reviews.images,
      createdAt: schema.reviews.createdAt,
      productName: schema.products.name,
      productSlug: schema.products.slug,
    })
    .from(schema.reviews)
    .innerJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
    .where(eq(schema.reviews.userId, userId))
    .orderBy(desc(schema.reviews.createdAt));

  return rows;
}
