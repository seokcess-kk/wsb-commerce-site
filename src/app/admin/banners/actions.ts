"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";

function revalidate() {
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function createBanner(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("제목을 입력하세요.");
  await getDb().insert(schema.banners).values({
    title,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    linkUrl: String(formData.get("linkUrl") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  });
  revalidate();
}

export async function toggleBanner(id: string, isActive: boolean) {
  await requireAdmin();
  await getDb()
    .update(schema.banners)
    .set({ isActive })
    .where(eq(schema.banners.id, id));
  revalidate();
}

export async function deleteBanner(id: string) {
  await requireAdmin();
  await getDb().delete(schema.banners).where(eq(schema.banners.id, id));
  revalidate();
}
