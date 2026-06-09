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
 * Filters items by price range (inclusive bounds). Undefined = open.
 */
export function filterByPrice(
  items: ProductSummary[],
  min: number | undefined,
  max: number | undefined,
): ProductSummary[] {
  return items.filter((item) => {
    if (min !== undefined && item.basePrice < min) return false;
    if (max !== undefined && item.basePrice > max) return false;
    return true;
  });
}
