import { eq, desc, asc, and, or, ilike, gte, lte, SQL } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { toProductSummary, type ProductRow, type ProductSummary } from "@/lib/catalog/product-view";
import { toLikePattern } from "@/lib/catalog/search";
import type { SortKey } from "@/lib/catalog/sort";

const { products, categories, productVariants } = schema;

function joinRowToProductRow(r: {
  product: typeof products.$inferSelect;
  category: typeof categories.$inferSelect | null;
}): ProductRow {
  return {
    id: r.product.id,
    slug: r.product.slug,
    name: r.product.name,
    brand: r.product.brand,
    basePrice: r.product.basePrice,
    summary: r.product.summary,
    images: r.product.images,
    isPublished: r.product.isPublished,
    categorySlug: r.category?.slug ?? null,
    categoryName: r.category?.name ?? null,
  };
}

export type ListProductsOptions = {
  sort?: SortKey;
  minPrice?: number;
  maxPrice?: number;
  categorySlug?: string;
};

function buildProductOrderBy(sort: SortKey | undefined) {
  switch (sort) {
    case "price_asc":  return asc(products.basePrice);
    case "price_desc": return desc(products.basePrice);
    case "name":       return asc(products.name);
    case "newest":
    default:           return desc(products.createdAt);
  }
}

export async function listPublishedProducts(opts: ListProductsOptions = {}): Promise<ProductSummary[]> {
  const db = getDb();
  const { sort, minPrice, maxPrice, categorySlug } = opts;

  const conditions: SQL[] = [eq(products.isPublished, true)];
  if (minPrice !== undefined) conditions.push(gte(products.basePrice, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(products.basePrice, maxPrice));
  if (categorySlug !== undefined) conditions.push(eq(categories.slug, categorySlug));

  const query = db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(buildProductOrderBy(sort));

  const rows = await query;
  return rows.map(joinRowToProductRow).map(toProductSummary);
}

// 발행 상품을 이름/요약 부분일치로 검색. 빈 쿼리는 호출 측에서 거른다.
export async function searchProducts(query: string): Promise<ProductSummary[]> {
  const db = getDb();
  const pattern = toLikePattern(query);
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isPublished, true), or(ilike(products.name, pattern), ilike(products.summary, pattern))))
    .orderBy(desc(products.createdAt));
  return rows.map(joinRowToProductRow).map(toProductSummary);
}

export async function listProductsByCategory(categorySlug: string): Promise<ProductSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(categories.slug, categorySlug));
  return rows
    .map(joinRowToProductRow)
    .filter((r) => r.isPublished)
    .map(toProductSummary);
}

export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductDetail = ProductSummary & {
  description: string | null;
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
  ingredients: string | null;
  images: string[];
  variants: ProductVariant[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const p = rows[0].product;
  if (!p.isPublished) return null;
  const summary = toProductSummary(joinRowToProductRow(rows[0]));
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, p.id))
    .orderBy(productVariants.sortOrder);
  return {
    ...summary,
    description: p.description,
    reviewPhraseNo: p.reviewPhraseNo,
    noticeText: p.noticeText,
    reportNo: p.reportNo,
    functionality: p.functionality,
    intakeNotice: p.intakeNotice,
    ingredients: p.ingredients,
    images: p.images,
    variants,
  };
}

export async function listCategories(): Promise<{ slug: string; name: string }[]> {
  const db = getDb();
  const rows = await db.select().from(categories).orderBy(categories.sortOrder);
  return rows.map((c) => ({ slug: c.slug, name: c.name }));
}
