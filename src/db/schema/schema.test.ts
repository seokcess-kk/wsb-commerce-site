import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { categories, products, productVariants, orders, orderItems, payments, banners } from "./index";
import { reviews } from "./reviews";
import { wishlists } from "./wishlists";
import { coupons } from "./coupons";
import { userCoupons } from "./user-coupons";
import { addresses } from "./addresses";
import { inquiries } from "./inquiries";
import { orderCancellations } from "./order-cancellations";

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

it("reviews 테이블 컬럼", () => {
  expect(Object.keys(reviews)).toEqual(expect.arrayContaining(["id","productId","userId","orderId","rating","title","body","images","createdAt"]));
});
it("wishlists 테이블 컬럼", () => {
  expect(Object.keys(wishlists)).toEqual(expect.arrayContaining(["id","userId","productId","createdAt"]));
});
it("coupons 테이블 컬럼", () => {
  expect(Object.keys(coupons)).toEqual(expect.arrayContaining(["id","code","name","discountType","discountValue","minSubtotal","maxDiscount","startsAt","endsAt","isActive"]));
});
it("userCoupons 테이블 컬럼", () => {
  expect(Object.keys(userCoupons)).toEqual(expect.arrayContaining(["id","couponId","userId","usedAt","orderId"]));
});
it("addresses 테이블 컬럼", () => {
  expect(Object.keys(addresses)).toEqual(expect.arrayContaining(["id","userId","label","recipient","phone","zipcode","address1","address2","isDefault"]));
});
it("inquiries 테이블 컬럼", () => {
  expect(Object.keys(inquiries)).toEqual(expect.arrayContaining(["id","userId","email","category","subject","body","status","answer","createdAt"]));
});
it("orderCancellations 테이블 컬럼", () => {
  expect(Object.keys(orderCancellations)).toEqual(expect.arrayContaining(["id","orderId","userId","type","reason","status","createdAt"]));
});
it("orders 쿠폰 컬럼", () => {
  expect(Object.keys(orders)).toEqual(expect.arrayContaining(["couponCode","couponDiscount"]));
});
