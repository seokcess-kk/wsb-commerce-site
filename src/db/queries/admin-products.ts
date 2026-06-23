import { eq, desc, and, or, ilike, isNull, inArray, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type AdminVariantStock = { id: string; name: string; stock: number };

export type ProductListParams = {
  q?: string;
  published?: boolean;
  page?: number;
  pageSize?: number;
};

// 상품 목록(어드민): 검색(상품명/브랜드) + 노출 필터 + 페이지네이션. total 도 반환.
export async function listAllProductsAdmin(params: ProductListParams = {}) {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 30;

  // 소프트 삭제된 상품은 항상 제외.
  const conds: SQL[] = [isNull(schema.products.deletedAt)];
  if (params.published !== undefined) {
    conds.push(eq(schema.products.isPublished, params.published));
  }
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    const search = or(
      ilike(schema.products.name, term),
      ilike(schema.products.brand, term),
    );
    if (search) conds.push(search);
  }
  const where = and(...conds);

  const baseRows = await db
    .select({
      id: schema.products.id, name: schema.products.name, brand: schema.products.brand,
      basePrice: schema.products.basePrice, isPublished: schema.products.isPublished, slug: schema.products.slug,
    })
    .from(schema.products)
    .where(where)
    .orderBy(desc(schema.products.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // 각 상품의 옵션(variant)별 재고 — 목록 표시 + 빠른수정용.
  const ids = baseRows.map((r) => r.id);
  const variantRows = ids.length
    ? await db
        .select({
          id: schema.productVariants.id,
          productId: schema.productVariants.productId,
          name: schema.productVariants.name,
          stock: schema.productVariants.stock,
        })
        .from(schema.productVariants)
        .where(inArray(schema.productVariants.productId, ids))
        .orderBy(schema.productVariants.sortOrder)
    : [];
  const byProduct = new Map<string, AdminVariantStock[]>();
  for (const v of variantRows) {
    const arr = byProduct.get(v.productId) ?? [];
    arr.push({ id: v.id, name: v.name, stock: v.stock });
    byProduct.set(v.productId, arr);
  }
  const rows = baseRows.map((r) => {
    const variants = byProduct.get(r.id) ?? [];
    return { ...r, variants, totalStock: variants.reduce((s, v) => s + v.stock, 0) };
  });

  const [countRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.products)
    .where(where);

  return { rows, total: countRow?.c ?? 0, page, pageSize };
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
