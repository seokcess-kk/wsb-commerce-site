import Link from "next/link";
import { listAllProductsAdmin } from "@/db/queries/admin-products";
import { publishedFromView, clampPage, productTotalPages } from "@/lib/admin/product-list-params";
import { formatKRW } from "@/lib/format";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "visible", label: "노출" },
  { value: "hidden", label: "숨김" },
];

function buildHref(p: { view?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (p.view) sp.set("view", p.view);
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; page?: string }>;
}) {
  const { view = "", q = "", page: pageRaw } = await searchParams;
  const page = clampPage(pageRaw);
  const { rows, total, pageSize } = await listAllProductsAdmin({
    q,
    published: publishedFromView(view),
    page,
  });
  const totalPages = productTotalPages(total, pageSize);

  const toolbar = (
    <>
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const on = view === f.value;
          return (
            <Link key={f.value || "all"} href={buildHref({ view: f.value, q })}
              className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
              {f.label}
            </Link>
          );
        })}
      </div>
      <form method="get" className="ml-auto flex items-center gap-2">
        {view && <input type="hidden" name="view" value={view} />}
        <AdminInput name="q" defaultValue={q} placeholder="상품명·브랜드 검색" className="w-56" />
        <AdminButton>검색</AdminButton>
        <Link href="/admin/products/new"><AdminButton>+ 상품 등록</AdminButton></Link>
      </form>
    </>
  );

  const pagination = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
    <Link key={p} href={buildHref({ view, q, page: p })}
      className={p === page ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg border border-[var(--ad-line)] px-3 py-1.5 text-sm text-[var(--ad-mut)]"}>{p}</Link>
  )) : null;

  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">상품관리</h1>
      <p className="mb-2 font-mono text-[11px] text-[var(--ad-mut-2)]">총 {total}건</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        pagination={pagination}
        head={<><th className={TH}>상품명</th><th className={TH}>브랜드</th><th className={TH}>가격</th><th className={TH}>노출</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {rows.map((p) => (
          <tr key={p.id} className={ROW}>
            <td className={`${TD} font-semibold`}>{p.name}</td>
            <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{p.brand}</td>
            <td className={`${TD} font-mono`}>{formatKRW(p.basePrice)}</td>
            <td className={TD}><StatusBadge value={p.isPublished ? "visible" : "hidden"} /></td>
            <td className={`${TD} text-right`}><Link href={`/admin/products/${p.id}`} className="font-semibold text-[var(--ad-accent)] hover:underline">수정</Link></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
