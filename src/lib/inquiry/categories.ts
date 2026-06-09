export const INQUIRY_CATEGORIES = ["배송", "주문", "상품", "기타"] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];
