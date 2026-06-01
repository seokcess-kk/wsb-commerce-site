import { describe, it, expect } from "vitest";
import { buildProductJsonLd } from "./product-jsonld";

describe("buildProductJsonLd", () => {
  it("Product 스키마와 KRW Offer 생성", () => {
    const j = buildProductJsonLd({
      name: "FOCUS",
      description: "설명",
      brand: "NUTROGIN",
      priceKRW: 39000,
      url: "https://x.com/products/nutrogin-focus",
      image: "/a.png",
      availability: true,
    });
    expect(j["@type"]).toBe("Product");
    expect(j.brand.name).toBe("NUTROGIN");
    expect(j.offers.price).toBe(39000);
    expect(j.offers.priceCurrency).toBe("KRW");
    expect(j.offers.availability).toBe("https://schema.org/InStock");
  });

  it("이미지 없으면 image 생략, 품절이면 OutOfStock", () => {
    const j = buildProductJsonLd({
      name: "x",
      description: "d",
      brand: "WSB",
      priceKRW: 1000,
      url: "u",
      image: null,
      availability: false,
    });
    expect("image" in j).toBe(false);
    expect(j.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});
