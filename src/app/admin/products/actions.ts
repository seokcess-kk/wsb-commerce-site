"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CATALOG_TAG } from "@/db/queries/products";

type VariantInput = { name: string; priceDelta: number; stock: number };

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string | null;
  basePrice: number;
  summary: string | null;
  description: string | null;
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
  ingredients: string | null;
  images: string[];
  isPublished: boolean;
  variants: VariantInput[];
};

export async function saveProduct(input: ProductInput) {
  await requireAdmin();
  const db = getDb();
  const { id, variants, ...fields } = input;
  let productId = id;

  if (id) {
    await db
      .update(schema.products)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(schema.products.id, id));
  } else {
    const [created] = await db
      .insert(schema.products)
      .values(fields)
      .returning();
    productId = created.id;
  }

  // variants 교체(단순화): 기존 삭제 후 재삽입.
  // NOTE: variantId가 재발급된다. 과거 주문은 order_items 스냅샷이라 무관하며,
  // 장바구니의 옛 variantId는 주문 생성 API에서 400으로 거부된다. v1 허용 trade-off.
  await db
    .delete(schema.productVariants)
    .where(eq(schema.productVariants.productId, productId!));

  if (variants.length) {
    await db.insert(schema.productVariants).values(
      variants.map((v, i) => ({
        productId: productId!,
        name: v.name,
        priceDelta: v.priceDelta,
        stock: v.stock,
        sortOrder: i,
      })),
    );
  }

  // 카탈로그 데이터 캐시(목록·연관·검색·카테고리) 무효화 — 'max'는 stale-while-revalidate(권장).
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}
