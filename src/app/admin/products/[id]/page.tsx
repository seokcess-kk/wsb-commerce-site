import { notFound } from "next/navigation";
import { listCategoriesAdmin, getProductForEdit } from "@/db/queries/admin-products";
import { ProductForm } from "@/components/admin/product-form";
import type { ProductInput } from "@/app/admin/products/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [result, categories] = await Promise.all([
    getProductForEdit(id),
    listCategoriesAdmin(),
  ]);

  if (!result) notFound();

  const { product: p, variants } = result;

  const initial: ProductInput = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    categoryId: p.categoryId ?? null,
    basePrice: p.basePrice,
    summary: p.summary ?? null,
    description: p.description ?? null,
    reviewPhraseNo: p.reviewPhraseNo ?? null,
    noticeText: p.noticeText ?? null,
    reportNo: p.reportNo ?? null,
    functionality: p.functionality ?? null,
    intakeNotice: p.intakeNotice ?? null,
    ingredients: p.ingredients ?? null,
    images: p.images ?? [],
    isPublished: p.isPublished,
    variants: variants.map((v) => ({
      name: v.name,
      priceDelta: v.priceDelta,
      stock: v.stock,
    })),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">상품 수정</h1>
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
