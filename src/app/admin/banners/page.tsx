import { listAllBanners } from "@/db/queries/banners";
import { createBanner, toggleBanner, deleteBanner } from "./actions";
import { AdminCard } from "@/components/admin/ui/card";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await listAllBanners();
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">배너관리</h1>
      <AdminCard title="새 배너 추가" className="mb-5">
        <form action={createBanner} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">제목 <span className="text-xs text-[var(--ad-accent)]">필수</span><AdminInput name="title" required placeholder="배너 제목" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">이미지 URL<AdminInput name="imageUrl" placeholder="https://..." className="w-56" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">링크 URL<AdminInput name="linkUrl" placeholder="https://..." className="w-56" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">순서<AdminInput name="sortOrder" type="number" defaultValue={0} className="w-20" /></label>
          <AdminButton type="submit">추가</AdminButton>
        </form>
      </AdminCard>
      <DataTable
        empty={banners.length === 0}
        head={<><th className={TH}>제목</th><th className={TH}>이미지 URL</th><th className={TH}>링크 URL</th><th className={TH}>순서</th><th className={TH}>상태</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {banners.map((b) => {
          async function onToggle() { "use server"; await toggleBanner(b.id, !b.isActive); }
          async function onDelete() { "use server"; await deleteBanner(b.id); }
          return (
            <tr key={b.id} className={ROW}>
              <td className={`${TD} font-semibold`}>{b.title}</td>
              <td className={`${TD} max-w-[160px] truncate font-mono text-xs text-[var(--ad-mut)]`}>{b.imageUrl ?? "-"}</td>
              <td className={`${TD} max-w-[160px] truncate font-mono text-xs text-[var(--ad-mut)]`}>{b.linkUrl ?? "-"}</td>
              <td className={`${TD} font-mono text-xs`}>{b.sortOrder}</td>
              <td className={TD}><StatusBadge value={b.isActive ? "visible" : "hidden"} /></td>
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  <form action={onToggle}><AdminButton variant="ghost" className="!py-1 !text-xs">{b.isActive ? "숨기기" : "노출"}</AdminButton></form>
                  <form action={onDelete}><AdminButton variant="danger" className="!py-1 !text-xs">삭제</AdminButton></form>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
