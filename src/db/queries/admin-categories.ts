import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

// 카테고리 목록 + 각 카테고리에 속한(소프트삭제 제외) 상품 수. 정렬 순서대로.
export async function listCategoriesWithCount() {
  const db = getDb();
  return db
    .select({
      id: schema.categories.id,
      slug: schema.categories.slug,
      name: schema.categories.name,
      sortOrder: schema.categories.sortOrder,
      productCount: sql<number>`count(${schema.products.id})::int`,
    })
    .from(schema.categories)
    .leftJoin(
      schema.products,
      and(eq(schema.products.categoryId, schema.categories.id), isNull(schema.products.deletedAt)),
    )
    .groupBy(schema.categories.id)
    .orderBy(schema.categories.sortOrder);
}
