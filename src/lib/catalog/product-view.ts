import { formatKRW } from "@/lib/format";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  basePrice: number;
  summary: string | null;
  images: string[];
  isPublished: boolean;
  categorySlug: string | null;
  categoryName: string | null;
};

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  isNutrogin: boolean;
  priceLabel: string;
  thumbnail: string | null;
  summary: string | null;
  categorySlug: string | null;
  categoryName: string | null;
};

export function isNutroginBrand(brand: string): boolean {
  return brand.trim().toUpperCase() === "NUTROGIN";
}

export function displayPriceLabel(amount: number): string {
  return formatKRW(amount);
}

export function toProductSummary(row: ProductRow): ProductSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    isNutrogin: isNutroginBrand(row.brand),
    priceLabel: displayPriceLabel(row.basePrice),
    thumbnail: row.images[0] ?? null,
    summary: row.summary,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
  };
}
