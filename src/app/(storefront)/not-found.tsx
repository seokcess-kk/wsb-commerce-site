import { NotFoundContent } from "@/components/ui/not-found-content";

// 스토어프론트 세그먼트 내부 notFound()(예: 잘못된 상품/카테고리 slug) — 헤더/푸터는 레이아웃이 감싼다.
export default function NotFound() {
  return <NotFoundContent />;
}
