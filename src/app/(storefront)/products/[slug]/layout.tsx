import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/queries/products";

// 존재 확인을 세그먼트 layout 에서 수행한다. loading.tsx 의 Suspense 는 page 는 감싸지만
// 같은 세그먼트의 layout 은 감싸지 않으므로(스트리밍 시작 전), 여기서 notFound() 를 던지면
// 미존재/미발행 상품은 실제 HTTP 404 로 응답된다(soft-404 방지). 유효 상품은 page 의 스켈레톤 유지.
// getProductBySlug 는 React cache() 로 메모이즈돼 page 와 쿼리를 공유한다(요청당 1회).
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return children;
}
