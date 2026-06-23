import { listCategoriesWithCount } from "@/db/queries/admin-categories";
import { createCategory } from "./actions";
import { AdminCard } from "@/components/admin/ui/card";
import { DataTable, TH } from "@/components/admin/ui/data-table";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";
import { CategoryRow } from "@/components/admin/category-row";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesWithCount();
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">카테고리관리</h1>
      <AdminCard title="새 카테고리 추가" className="mb-5">
        <form action={createCategory} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">
            카테고리명 <span className="text-xs text-[var(--ad-accent)]">필수</span>
            <AdminInput name="name" required placeholder="예: 면역" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">
            순서
            <AdminInput name="sortOrder" type="number" defaultValue={0} className="w-20" />
          </label>
          <AdminButton type="submit">추가</AdminButton>
        </form>
        <p className="mt-2 text-xs text-[var(--ad-mut-2)]">슬러그(URL /category/…)는 카테고리명에서 자동 생성됩니다.</p>
      </AdminCard>
      <DataTable
        empty={categories.length === 0}
        head={
          <>
            <th className={TH}>카테고리명</th>
            <th className={TH}>슬러그</th>
            <th className={TH}>상품수</th>
            <th className={TH}>순서</th>
            <th className={`${TH} text-right`}>관리</th>
          </>
        }
      >
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </DataTable>
    </div>
  );
}
