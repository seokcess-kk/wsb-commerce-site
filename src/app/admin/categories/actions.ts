"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CATALOG_TAG } from "@/db/queries/products";
import { slugify, uniqueSlug } from "@/lib/catalog/slugify";

function revalidate() {
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/admin/categories");
}

// 카테고리 생성 — slug 는 카테고리명에서 자동 생성(중복 시 접미사).
export async function createCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("카테고리명을 입력해 주세요.");
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  const db = getDb();
  const existing = await db.select({ slug: schema.categories.slug }).from(schema.categories);
  const slug = uniqueSlug(slugify(name), new Set(existing.map((c) => c.slug)));
  await db.insert(schema.categories).values({ name, slug, sortOrder });
  revalidate();
}

// 카테고리 수정 — 이름/정렬만. slug(공개 URL /category/[slug])는 SEO 안정성을 위해 변경하지 않는다.
export async function updateCategory(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("카테고리명을 입력해 주세요.");
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  await getDb().update(schema.categories).set({ name, sortOrder }).where(eq(schema.categories.id, id));
  revalidate();
}

// 카테고리 삭제 — 사용 중인 상품이 있으면 차단(외래키 보호 + 친절한 안내).
export async function deleteCategory(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.products)
    .where(and(eq(schema.products.categoryId, id), isNull(schema.products.deletedAt)));
  if ((row?.c ?? 0) > 0) {
    return { error: `이 카테고리를 쓰는 상품 ${row.c}개가 있어 삭제할 수 없습니다. 먼저 상품의 카테고리를 변경하세요.` };
  }
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidate();
  return {};
}
