"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CATALOG_TAG } from "@/db/queries/products";
import { slugify, uniqueSlug } from "@/lib/catalog/slugify";

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

const nullableText = z.string().trim().nullable().transform((v) => (v ? v : null));

const variantSchema = z.object({
  name: z.string().trim().min(1, "옵션명을 입력해 주세요."),
  priceDelta: z.number().int("추가금은 정수여야 합니다.").finite(),
  stock: z.number().int("재고는 정수여야 합니다.").min(0, "재고는 0 이상이어야 합니다."),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim(), // 비어 있으면 name 에서 자동 생성
  name: z.string().trim().min(1, "상품명을 입력해 주세요."),
  brand: z.string().trim().min(1).default("WSB"),
  categoryId: z.string().uuid().nullable(),
  basePrice: z.number().int("판매가는 정수여야 합니다.").min(0, "판매가는 0 이상이어야 합니다."),
  summary: nullableText,
  description: nullableText,
  reviewPhraseNo: nullableText,
  noticeText: nullableText,
  reportNo: nullableText,
  functionality: nullableText,
  intakeNotice: nullableText,
  ingredients: nullableText,
  images: z.array(z.string().trim().min(1)),
  isPublished: z.boolean(),
  variants: z.array(variantSchema).min(1, "옵션을 최소 1개 등록해 주세요."),
});

// 상품 등록/수정. 성공 시 목록으로 redirect, 검증·저장 실패 시 { error } 반환(폼에 표시).
export async function saveProduct(input: ProductInput): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, slug: rawSlug, variants, ...rest } = parsed.data;
  const db = getDb();

  // slug 자동 생성: 입력값이 있으면 정규화, 없으면 상품명에서 생성. 기존 slug 와 충돌하면 접미사.
  const baseSlug = slugify(rawSlug || rest.name);
  const others = await db
    .select({ slug: schema.products.slug })
    .from(schema.products)
    .where(id ? ne(schema.products.id, id) : undefined);
  const slug = uniqueSlug(baseSlug, new Set(others.map((p) => p.slug)));

  // product + variants 를 단일 트랜잭션으로 원자화(중간 실패 시 부분 상태 방지).
  try {
    await db.transaction(async (tx) => {
      const fields = { ...rest, slug };
      let productId = id;
      if (id) {
        await tx.update(schema.products).set({ ...fields, updatedAt: new Date() }).where(eq(schema.products.id, id));
      } else {
        const [created] = await tx.insert(schema.products).values(fields).returning();
        productId = created.id;
      }

      // variants 교체(전체 삭제 후 재삽입). NOTE: variantId 재발급 — 과거 주문은 order_items
      // 스냅샷이라 무관, 장바구니의 옛 variantId 는 주문 생성 API에서 거부된다. v1 trade-off.
      await tx.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId!));
      await tx.insert(schema.productVariants).values(
        variants.map((v, i) => ({
          productId: productId!,
          name: v.name,
          priceDelta: v.priceDelta,
          stock: v.stock,
          sortOrder: i,
        })),
      );
    });
  } catch (e) {
    // UNIQUE 위반(slug) 등 — uniqueSlug 로 사전 회피하지만 동시 등록 레이스의 마지막 방어선.
    const msg = (e as { code?: string })?.code === "23505" ? "이미 사용 중인 슬러그입니다." : "저장 중 오류가 발생했습니다.";
    return { error: msg };
  }

  // 카탈로그 데이터 캐시(목록·연관·검색·카테고리) 무효화 — 'max'는 stale-while-revalidate(권장).
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

// 재고 빠른수정: 특정 옵션(variant)의 재고만 절대값으로 갱신. 전체 saveProduct(variants 전량 교체로
// variantId 재발급)를 우회해 가장 빈번한 운영 작업을 안전·저비용으로 처리한다.
export async function updateVariantStock(variantId: string, stock: number): Promise<{ error?: string }> {
  await requireAdmin();
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "재고는 0 이상의 정수여야 합니다." };
  }
  await getDb().update(schema.productVariants).set({ stock }).where(eq(schema.productVariants.id, variantId));

  // 재고 변경을 PDP/카탈로그 캐시에 반영.
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return {};
}

// 상품 소프트 삭제(보관): deletedAt 기록 + 노출 해제. 주문 이력은 order_items 스냅샷이라 보존된다.
// 공개 쿼리는 isPublished=false 로 자동 숨겨지고, 어드민 목록은 deletedAt IS NULL 로 제외한다.
export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  await db
    .update(schema.products)
    .set({ deletedAt: new Date(), isPublished: false, updatedAt: new Date() })
    .where(eq(schema.products.id, id));

  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return {};
}
