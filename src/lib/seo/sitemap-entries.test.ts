import { describe, it, expect } from "vitest";
import { buildSitemapEntries } from "./sitemap-entries";
describe("buildSitemapEntries", () => {
  it("정적+카테고리+상품 URL 생성, trailing slash 정규화", () => {
    const e = buildSitemapEntries("https://x.com/", ["p1"], ["c1"]);
    const urls = e.map((x) => x.url);
    expect(urls).toContain("https://x.com");
    expect(urls).toContain("https://x.com/products");
    expect(urls).toContain("https://x.com/category/c1");
    expect(urls).toContain("https://x.com/products/p1");
    expect(e.find((x) => x.url === "https://x.com")!.priority).toBe(1);
  });
});
