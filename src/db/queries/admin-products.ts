import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export async function listAllProductsAdmin() {
  const db = getDb();
  return db.select({
    id: schema.products.id, name: schema.products.name, brand: schema.products.brand,
    basePrice: schema.products.basePrice, isPublished: schema.products.isPublished, slug: schema.products.slug,
  }).from(schema.products).orderBy(desc(schema.products.createdAt));
}

export async function listCategoriesAdmin() {
  return getDb()
    .select({ id: schema.categories.id, name: schema.categories.name })
    .from(schema.categories)
    .orderBy(schema.categories.sortOrder);
}

export async function getProductForEdit(id: string) {
  const db = getDb();
  const [p] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (!p) return null;
  const variants = await db
    .select()
    .from(schema.productVariants)
    .where(eq(schema.productVariants.productId, id))
    .orderBy(schema.productVariants.sortOrder);
  return { product: p, variants };
}
