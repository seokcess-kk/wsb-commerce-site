"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  validateCouponInput,
  normalizeCouponCode,
  type CouponInputForValidation,
} from "@/lib/admin/coupon-input";
import { countCouponIssued } from "@/db/queries/admin-coupons";

function revalidate() {
  revalidatePath("/admin/coupons");
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseForm(formData: FormData): CouponInputForValidation {
  const maxRaw = String(formData.get("maxDiscount") ?? "").trim();
  return {
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    discountType: String(formData.get("discountType") ?? ""),
    discountValue: Number(formData.get("discountValue") ?? 0),
    minSubtotal: Number(formData.get("minSubtotal") ?? 0),
    maxDiscount: maxRaw ? Number(maxRaw) : null,
    startsAt: parseDate(formData.get("startsAt")),
    endsAt: parseDate(formData.get("endsAt")),
  };
}

export async function createCoupon(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const input = parseForm(formData);
  const v = validateCouponInput(input);
  if (!v.ok) return { error: v.error };

  const db = getDb();
  const code = normalizeCouponCode(input.code);
  const [existing] = await db
    .select({ id: schema.coupons.id })
    .from(schema.coupons)
    .where(eq(schema.coupons.code, code))
    .limit(1);
  if (existing) return { error: "이미 존재하는 쿠폰 코드입니다." };

  await db.insert(schema.coupons).values({
    code,
    name: input.name.trim(),
    discountType: input.discountType,
    discountValue: input.discountValue,
    minSubtotal: input.minSubtotal,
    maxDiscount: input.maxDiscount,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    isActive: formData.get("isActive") === "on",
  });
  revalidate();
  return {};
}

export async function updateCoupon(id: string, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const input = parseForm(formData);
  const v = validateCouponInput(input);
  if (!v.ok) return { error: v.error };

  const db = getDb();
  const code = normalizeCouponCode(input.code);
  const [existing] = await db
    .select({ id: schema.coupons.id })
    .from(schema.coupons)
    .where(eq(schema.coupons.code, code))
    .limit(1);
  if (existing && existing.id !== id) return { error: "다른 쿠폰이 같은 코드를 사용 중입니다." };

  await db
    .update(schema.coupons)
    .set({
      code,
      name: input.name.trim(),
      discountType: input.discountType,
      discountValue: input.discountValue,
      minSubtotal: input.minSubtotal,
      maxDiscount: input.maxDiscount,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: formData.get("isActive") === "on",
    })
    .where(eq(schema.coupons.id, id));
  revalidate();
  return {};
}

export async function toggleCoupon(id: string, isActive: boolean) {
  await requireAdmin();
  await getDb().update(schema.coupons).set({ isActive }).where(eq(schema.coupons.id, id));
  revalidate();
}

// 발급 이력이 있으면 hard delete 차단(user_coupons cascade 로 이력 유실 방지) — 비활성화로 유도.
export async function deleteCoupon(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const issued = await countCouponIssued(id);
  if (issued > 0) {
    return { error: "이미 발급된 쿠폰은 삭제할 수 없습니다. 비활성화하세요." };
  }
  await getDb().delete(schema.coupons).where(eq(schema.coupons.id, id));
  revalidate();
  return {};
}
