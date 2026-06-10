import Link from "next/link";
import { listAllOrders } from "@/db/queries/admin-orders";
import { ORDER_STATUSES, statusLabel } from "@/lib/admin/order-status";
import { formatKRW, formatDate } from "@/lib/format";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const TABS = [{ value: "", label: "전체" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))];

function buildHref(p: { status?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "", q = "", page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  const { rows, total, pageSize } = await listAllOrders({ status: status || undefined, q, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toolbar = (
    <>
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => {
          const on = status === t.value;
          return (
            <Link key={t.value || "all"} href={buildHref({ status: t.value, q })}
              className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
              {t.label}
            </Link>
          );
        })}
      </div>
      <form method="get" className="ml-auto flex items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <AdminInput name="q" defaultValue={q} placeholder="주문번호·주문자 검색" className="w-56" />
        <AdminButton>검색</AdminButton>
      </form>
    </>
  );

  const pagination = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
    <Link key={p} href={buildHref({ status, q, page: p })}
      className={p === page ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg border border-[var(--ad-line)] px-3 py-1.5 text-sm text-[var(--ad-mut)]"}>{p}</Link>
  )) : null;

  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">주문관리</h1>
      <p className="mb-2 font-mono text-[11px] text-[var(--ad-mut-2)]">총 {total}건</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        pagination={pagination}
        head={<><th className={TH}>주문번호</th><th className={TH}>상태</th><th className={TH}>주문자</th><th className={TH}>금액</th><th className={TH}>주문일</th></>}
      >
        {rows.map((o) => (
          <tr key={o.id} className={ROW}>
            <td className={TD}><Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-[var(--ad-accent)] hover:underline">{o.orderNumber}</Link></td>
            <td className={TD}><StatusBadge value={o.status} /></td>
            <td className={TD}>{o.customerName}</td>
            <td className={`${TD} font-mono`}>{formatKRW(o.totalAmount)}</td>
            <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{formatDate(o.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
