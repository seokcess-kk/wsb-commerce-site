import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { aggregateRatings } from "@/lib/reviews/aggregate";

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
    .where(eq(schema.reviews.productId, productId))
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
  const rows = await db
    .select({ rating: schema.reviews.rating })
    .from(schema.reviews)
    .where(eq(schema.reviews.productId, productId));

  return aggregateRatings(rows.map((r) => r.rating));
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
