import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";
import { listPublishedProducts, listCategories } from "@/db/queries/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([listPublishedProducts(), listCategories()]);
  return buildSitemapEntries(getSiteUrl(), products.map((p) => p.slug), categories.map((c) => c.slug))
    .map((e) => ({ url: e.url, priority: e.priority }));
}
