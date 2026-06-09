import Link from "next/link";
import { listAllOrders } from "@/db/queries/admin-orders";
import { ORDER_STATUSES, statusLabel } from "@/lib/admin/order-status";
import { formatKRW, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TABS = [{ value: "", label: "전체" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))];

function buildHref(params: { status?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
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

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">주문관리</h1>

      <nav className="mt-4 flex flex-wrap gap-1 text-sm">
        {STATUS_TABS.map((t) => {
          const active = status === t.value;
          return (
            <Link
              key={t.value || "all"}
              href={buildHref({ status: t.value, q })}
              className={
                active
                  ? "rounded-md bg-wsb-green px-3 py-1.5 font-semibold text-white"
                  : "rounded-md px-3 py-1.5 font-semibold text-stone-500 hover:bg-stone-100"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <form method="get" className="mt-3 flex items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="주문번호 또는 주문자명 검색"
          className="w-64 rounded-md border border-stone-300 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        />
        <button className="rounded-md bg-wsb-carbon px-3 py-1.5 text-sm font-semibold text-white">검색</button>
        {q && (
          <Link href={buildHref({ status })} className="text-xs text-stone-400 hover:underline">
            초기화
          </Link>
        )}
      </form>

      <p className="mt-3 text-xs text-stone-400">총 {total}건</p>

      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">주문번호</th>
            <th>상태</th>
            <th>주문자</th>
            <th>금액</th>
            <th>주문일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-stone-100">
              <td className="py-2">
                <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono text-wsb-green hover:underline">
                  {o.orderNumber}
                </Link>
              </td>
              <td>{statusLabel(o.status)}</td>
              <td>{o.customerName}</td>
              <td className="font-mono">{formatKRW(o.totalAmount)}</td>
              <td className="font-mono text-xs text-stone-500">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-10 text-center text-sm text-stone-400">주문이 없습니다.</p>}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref({ status, q, page: p })}
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
