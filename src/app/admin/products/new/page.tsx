import { listCategoriesAdmin } from "@/db/queries/admin-products";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await listCategoriesAdmin();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-[var(--ad-ink)]">상품 등록</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
