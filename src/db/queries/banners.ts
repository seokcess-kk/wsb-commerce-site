import { eq, asc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export async function listActiveBanners() {
  return getDb()
    .select()
    .from(schema.banners)
    .where(eq(schema.banners.isActive, true))
    .orderBy(asc(schema.banners.sortOrder));
}

export async function listAllBanners() {
  return getDb()
    .select()
    .from(schema.banners)
    .orderBy(asc(schema.banners.sortOrder));
}
