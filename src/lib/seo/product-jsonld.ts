export type ProductJsonLdInput = {
  name: string;
  description: string;
  brand: string;
  priceKRW: number;
  url: string;
  image?: string | null;
  availability: boolean;
};

export function buildProductJsonLd(p: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: { "@type": "Brand", name: p.brand },
    ...(p.image ? { image: p.image } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      price: p.priceKRW,
      availability: p.availability
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: p.url,
    },
  };
}
