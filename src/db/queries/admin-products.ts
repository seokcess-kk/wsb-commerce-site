import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export async function listAllProductsAdmin() {
  const db = getDb();
  return db.select({
    id: schema.products.id, name: schema.products.name, brand: schema.products.brand,
    basePrice: schema.products.basePrice, isPublished: schema.products.isPublished, slug: schema.products.slug,
  }).from(schema.products).orderBy(desc(schema.products.createdAt));
}
