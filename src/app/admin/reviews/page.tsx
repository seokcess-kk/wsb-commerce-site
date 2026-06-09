import Link from "next/link";
import { listReviewsAdmin } from "@/db/queries/admin-reviews";
import { formatDate } from "@/lib/format";
import { hideReview, unhideReview, deleteReview } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "visible", label: "노출" },
  { value: "hidden", label: "숨김" },
] as const;

function maskUser(userId: string): string {
  return `회원 ${userId.replace(/-/g, "").slice(0, 6)}`;
}

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

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">리뷰관리</h1>
      <p className="mt-1 text-sm text-stone-500">숨긴 리뷰는 상품 페이지의 평점·목록에서 제외됩니다.</p>

      <nav className="mt-4 flex gap-1 text-sm">
        {FILTERS.map((f) => {
          const active = (view ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/reviews?view=${f.value}` : "/admin/reviews"}
              className={
                active
                  ? "rounded-md bg-wsb-green px-3 py-1.5 font-semibold text-white"
                  : "rounded-md px-3 py-1.5 font-semibold text-stone-500 hover:bg-stone-100"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">상품</th>
            <th>평점</th>
            <th>내용</th>
            <th>이미지</th>
            <th>작성자</th>
            <th>상태</th>
            <th>작성일</th>
            <th className="text-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            async function handleHide() {
              "use server";
              await hideReview(r.id);
            }
            async function handleUnhide() {
              "use server";
              await unhideReview(r.id);
            }
            async function handleDelete() {
              "use server";
              await deleteReview(r.id);
            }
            return (
              <tr key={r.id} className="border-b border-stone-100 align-top">
                <td className="max-w-[10rem] truncate py-3 font-semibold text-wsb-carbon">
                  <Link href={`/products/${r.productSlug}`} className="hover:underline">
                    {r.productName}
                  </Link>
                </td>
                <td className="py-3 font-mono">{"★".repeat(r.rating)}</td>
                <td className="max-w-[18rem] py-3 text-stone-600">
                  {r.title && <span className="font-semibold">{r.title} · </span>}
                  <span className="line-clamp-2">{r.body}</span>
                </td>
                <td className="py-3 font-mono text-xs">{r.imageCount}장</td>
                <td className="py-3 font-mono text-xs text-stone-500">{maskUser(r.userId)}</td>
                <td className="py-3">
                  {r.isHidden ? (
                    <span className="text-stone-400">숨김</span>
                  ) : (
                    <span className="text-wsb-green">노출</span>
                  )}
                </td>
                <td className="py-3 font-mono text-xs text-stone-500">{formatDate(r.createdAt)}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {r.isHidden ? (
                      <form action={handleUnhide}>
                        <button className="rounded-md border border-wsb-green px-2 py-1 text-xs font-semibold text-wsb-green hover:bg-wsb-green/5">
                          복원
                        </button>
                      </form>
                    ) : (
                      <form action={handleHide}>
                        <button className="rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50">
                          숨기기
                        </button>
                      </form>
                    )}
                    <form action={handleDelete}>
                      <button className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                        삭제
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">리뷰가 없습니다.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/reviews?${view ? `view=${view}&` : ""}page=${p}`}
              className={
                p === page
                  ? "rounded-md bg-wsb-green px-3 py-1.5 font-semibold text-white"
                  : "rounded-md border border-stone-200 px-3 py-1.5 text-stone-600 hover:bg-stone-50"
              }
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
