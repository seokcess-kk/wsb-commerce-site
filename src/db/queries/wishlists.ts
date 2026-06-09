import { eq, and, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { formatKRW } from "@/lib/format";
import type { ProductSummary } from "@/lib/catalog/product-view";

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.wishlists.id })
    .from(schema.wishlists)
    .where(and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.productId, productId)))
    .limit(1);
  return !!row;
}

export async function listWishlist(userId: string): Promise<ProductSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ product: schema.products, category: schema.categories })
    .from(schema.wishlists)
    .innerJoin(schema.products, eq(schema.wishlists.productId, schema.products.id))
    .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .where(eq(schema.wishlists.userId, userId))
    .orderBy(desc(schema.wishlists.createdAt));

  return rows
    .filter((r) => r.product.isPublished)
    .map((r) => ({
      id: r.product.id,
      slug: r.product.slug,
      name: r.product.name,
      brand: r.product.brand,
      basePrice: r.product.basePrice,
      isNutrogin: r.product.brand.trim().toUpperCase() === "NUTROGIN",
      priceLabel: formatKRW(r.product.basePrice),
      thumbnail: r.product.images[0] ?? null,
      summary: r.product.summary,
      categorySlug: r.category?.slug ?? null,
      categoryName: r.category?.name ?? null,
    }));
}

/**
 * Toggle: insert if not wishlisted, delete if already wishlisted.
 * Returns the new boolean state (true = now wishlisted).
 */
export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const db = getDb();
  const already = await isWishlisted(userId, productId);
  if (already) {
    await db
      .delete(schema.wishlists)
      .where(and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.productId, productId)));
    return false;
  }
  await db
    .insert(schema.wishlists)
    .values({ userId, productId })
    .onConflictDoNothing();
  return true;
}

export async function countWishlist(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.wishlists.id })
    .from(schema.wishlists)
    .where(eq(schema.wishlists.userId, userId));
  return rows.length;
}
