import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { toProductSummary, type ProductRow, type ProductSummary } from "@/lib/catalog/product-view";

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

export async function listPublishedProducts(): Promise<ProductSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isPublished, true))
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
