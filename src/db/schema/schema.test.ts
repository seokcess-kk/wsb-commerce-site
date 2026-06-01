import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { categories, products, productVariants, orders, orderItems, payments, banners } from "./index";

describe("schema 형상", () => {
  it("products 는 규제 고지 컬럼을 갖는다", () => {
    const cols = getTableColumns(products);
    expect(cols).toHaveProperty("reviewPhraseNo");
    expect(cols).toHaveProperty("noticeText");
    expect(cols).toHaveProperty("basePrice");
    expect(cols).toHaveProperty("reportNo");
    expect(cols).toHaveProperty("functionality");
    expect(cols).toHaveProperty("intakeNotice");
    expect(cols).toHaveProperty("ingredients");
  });
  it("categories 는 slug 를 갖는다", () => {
    expect(getTableColumns(categories)).toHaveProperty("slug");
  });
  it("productVariants 는 stock 을 갖는다", () => {
    expect(getTableColumns(productVariants)).toHaveProperty("stock");
  });
  it("주문 스키마가 핵심 컬럼을 갖는다", () => {
    expect(getTableColumns(orders)).toHaveProperty("totalAmount");
    expect(getTableColumns(orders)).toHaveProperty("orderNumber");
    expect(getTableColumns(orderItems)).toHaveProperty("lineTotal");
    expect(getTableColumns(payments)).toHaveProperty("paymentKey");
  });
  it("배너 스키마 컬럼", () => {
    expect(getTableColumns(banners)).toHaveProperty("title");
    expect(getTableColumns(banners)).toHaveProperty("isActive");
  });
});
