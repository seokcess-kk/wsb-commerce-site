import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import {
  categories, products, productVariants, orders, orderItems, payments, banners,
  reviews, wishlists, coupons, userCoupons, addresses, inquiries, orderCancellations,
} from "./index";

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
  it("reviews 테이블 컬럼", () => {
    const cols = getTableColumns(reviews);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("productId");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("orderId");
    expect(cols).toHaveProperty("rating");
    expect(cols).toHaveProperty("title");
    expect(cols).toHaveProperty("body");
    expect(cols).toHaveProperty("images");
    expect(cols).toHaveProperty("isHidden");
    expect(cols).toHaveProperty("createdAt");
  });
  it("wishlists 테이블 컬럼", () => {
    const cols = getTableColumns(wishlists);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("productId");
    expect(cols).toHaveProperty("createdAt");
  });
  it("coupons 테이블 컬럼", () => {
    const cols = getTableColumns(coupons);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("code");
    expect(cols).toHaveProperty("name");
    expect(cols).toHaveProperty("discountType");
    expect(cols).toHaveProperty("discountValue");
    expect(cols).toHaveProperty("minSubtotal");
    expect(cols).toHaveProperty("maxDiscount");
    expect(cols).toHaveProperty("startsAt");
    expect(cols).toHaveProperty("endsAt");
    expect(cols).toHaveProperty("isActive");
  });
  it("userCoupons 테이블 컬럼", () => {
    const cols = getTableColumns(userCoupons);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("couponId");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("usedAt");
    expect(cols).toHaveProperty("orderId");
    expect(cols).toHaveProperty("createdAt");
  });
  it("addresses 테이블 컬럼", () => {
    const cols = getTableColumns(addresses);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("label");
    expect(cols).toHaveProperty("recipient");
    expect(cols).toHaveProperty("phone");
    expect(cols).toHaveProperty("zipcode");
    expect(cols).toHaveProperty("address1");
    expect(cols).toHaveProperty("address2");
    expect(cols).toHaveProperty("isDefault");
    expect(cols).toHaveProperty("createdAt");
  });
  it("inquiries 테이블 컬럼", () => {
    const cols = getTableColumns(inquiries);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("email");
    expect(cols).toHaveProperty("category");
    expect(cols).toHaveProperty("subject");
    expect(cols).toHaveProperty("body");
    expect(cols).toHaveProperty("status");
    expect(cols).toHaveProperty("answer");
    expect(cols).toHaveProperty("createdAt");
  });
  it("orderCancellations 테이블 컬럼", () => {
    const cols = getTableColumns(orderCancellations);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("orderId");
    expect(cols).toHaveProperty("userId");
    expect(cols).toHaveProperty("type");
    expect(cols).toHaveProperty("reason");
    expect(cols).toHaveProperty("status");
    expect(cols).toHaveProperty("createdAt");
  });
  it("orders 쿠폰 컬럼", () => {
    const cols = getTableColumns(orders);
    expect(cols).toHaveProperty("couponCode");
    expect(cols).toHaveProperty("couponDiscount");
  });
});
