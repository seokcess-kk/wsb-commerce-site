import { notFound } from "next/navigation";
import { listCategories } from "@/db/queries/products";

// 존재 확인을 세그먼트 layout 에서 수행(loading.tsx Suspense 밖) — 미존재 카테고리는 실제 404 로 응답.
// listCategories 는 React cache() 로 메모이즈돼 generateMetadata/page 와 쿼리를 공유한다.
export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await listCategories();
  if (!categories.some((c) => c.slug === slug)) notFound();
  return children;
}
