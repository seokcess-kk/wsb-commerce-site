"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { getStorageClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// 상품 이미지 업로드: FormData 의 files[] 를 Supabase Storage 에 올리고 공개 URL 배열을 반환한다.
// 첫 줄 requireAdmin 게이트. 형식/용량 검증 후 products/<uuid>.<ext> 경로로 저장.
export async function uploadProductImages(formData: FormData): Promise<{ urls?: string[]; error?: string }> {
  await requireAdmin();

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "업로드할 파일이 없습니다." };

  let storage;
  try {
    storage = getStorageClient();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const bucket = getEnv().SUPABASE_STORAGE_BUCKET;

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: `지원하지 않는 이미지 형식입니다(${file.type || "알 수 없음"}). JPG·PNG·WebP·AVIF 만 가능합니다.` };
    }
    if (file.size > MAX_BYTES) {
      return { error: `파일이 너무 큽니다(최대 5MB): ${file.name}` };
    }
    const ext = EXT_BY_TYPE[file.type] ?? "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return { error: `업로드에 실패했습니다: ${error.message}` };
    }
    const { data } = storage.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls };
}
