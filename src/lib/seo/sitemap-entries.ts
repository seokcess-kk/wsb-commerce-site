export type SitemapEntry = { url: string; priority: number };
const STATIC_PATHS = ["", "/products", "/support", "/policy/privacy", "/policy/terms", "/policy/shipping"];

export function buildSitemapEntries(siteUrl: string, productSlugs: string[], categorySlugs: string[]): SitemapEntry[] {
  const base = siteUrl.replace(/\/$/, "");
  const entries: SitemapEntry[] = STATIC_PATHS.map((p) => ({ url: `${base}${p}`, priority: p === "" ? 1 : 0.6 }));
  categorySlugs.forEach((s) => entries.push({ url: `${base}/category/${s}`, priority: 0.7 }));
  productSlugs.forEach((s) => entries.push({ url: `${base}/products/${s}`, priority: 0.8 }));
  return entries;
}
