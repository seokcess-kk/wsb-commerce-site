import type { ProductSummary } from "./product-view";

export type SortKey = "newest" | "price_asc" | "price_desc" | "name";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "최신순" },
  { key: "price_asc", label: "낮은 가격순" },
  { key: "price_desc", label: "높은 가격순" },
  { key: "name", label: "이름순" },
];

/**
 * Returns a NEW sorted array (never mutates input).
 * "newest" preserves DB insertion order (products are already ordered by createdAt DESC
 * from the query, and ProductSummary has no createdAt field).
 */
export function sortProductSummaries(items: ProductSummary[], key: SortKey): ProductSummary[] {
  const copy = [...items];
  switch (key) {
    case "price_asc":
      return copy.sort((a, b) => a.basePrice - b.basePrice);
    case "price_desc":
      return copy.sort((a, b) => b.basePrice - a.basePrice);
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    case "newest":
    default:
      return copy; // input already DB-ordered desc by createdAt
  }
}

/**
 * 반개구간 [min, max)로 필터: 하한 포함, 상한 배타. Undefined = 개방.
 * 상한을 배타로 두어 인접 가격대 프리셋이 경계값에서 중복되지 않게 한다.
 */
export function filterByPrice(
  items: ProductSummary[],
  min: number | undefined,
  max: number | undefined,
): ProductSummary[] {
  return items.filter((item) => {
    if (min !== undefined && item.basePrice < min) return false;
    if (max !== undefined && item.basePrice >= max) return false;
    return true;
  });
}
