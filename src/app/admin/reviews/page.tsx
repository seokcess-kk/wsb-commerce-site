import Link from "next/link";
import { listReviewsAdmin } from "@/db/queries/admin-reviews";
import { formatDate } from "@/lib/format";
import { hideReview, unhideReview, deleteReview } from "./actions";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const FILTERS = [{ value: "", label: "전체" }, { value: "visible", label: "노출" }, { value: "hidden", label: "숨김" }];
const maskUser = (id: string) => `회원 ${id.replace(/-/g, "").slice(0, 6)}`;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { view, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  const hidden = view === "hidden" ? true : view === "visible" ? false : undefined;
  const pageSize = 30;
  const { rows, total } = await listReviewsAdmin({ hidden }, page, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toolbar = (
    <div className="flex gap-1">
      {FILTERS.map((f) => {
        const on = (view ?? "") === f.value;
        return (
          <Link key={f.value} href={f.value ? `/admin/reviews?view=${f.value}` : "/admin/reviews"}
            className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
            {f.label}
          </Link>
        );
      })}
    </div>
  );

  const pagination = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
    <Link key={p} href={`/admin/reviews?${view ? `view=${view}&` : ""}page=${p}`}
      className={p === page ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg border border-[var(--ad-line)] px-3 py-1.5 text-sm text-[var(--ad-mut)]"}>{p}</Link>
  )) : null;

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">리뷰관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">숨긴 리뷰는 상품 페이지의 평점·목록에서 제외됩니다.</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        pagination={pagination}
        head={<><th className={TH}>상품</th><th className={TH}>평점</th><th className={TH}>내용</th><th className={TH}>작성자</th><th className={TH}>상태</th><th className={TH}>작성일</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {rows.map((r) => {
          async function onHide() { "use server"; await hideReview(r.id); }
          async function onUnhide() { "use server"; await unhideReview(r.id); }
          async function onDelete() { "use server"; await deleteReview(r.id); }
          return (
            <tr key={r.id} className={`${ROW} align-top`}>
              <td className={`${TD} max-w-[10rem] truncate font-semibold`}><Link href={`/products/${r.productSlug}`} className="hover:underline">{r.productName}</Link></td>
              <td className={`${TD} font-mono text-[var(--ad-accent)]`}>{"★".repeat(r.rating)}</td>
              <td className={`${TD} max-w-[20rem] text-[var(--ad-mut)]`}>{r.title && <b className="text-[var(--ad-ink)]">{r.title} · </b>}<span className="line-clamp-2">{r.body}</span><span className="ml-1 font-mono text-[10px] text-[var(--ad-mut-2)]">({r.imageCount}장)</span></td>
              <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{maskUser(r.userId)}</td>
              <td className={TD}><StatusBadge value={r.isHidden ? "hidden" : "visible"} /></td>
              <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{formatDate(r.createdAt)}</td>
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  {r.isHidden ? <form action={onUnhide}><AdminButton variant="ghost" className="!py-1 !text-xs">복원</AdminButton></form> : <form action={onHide}><AdminButton variant="ghost" className="!py-1 !text-xs">숨기기</AdminButton></form>}
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
