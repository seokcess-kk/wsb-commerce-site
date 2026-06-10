import Link from "next/link";
import { listCancellations } from "@/db/queries/admin-cancellations";
import { REQUEST_TYPE_LABEL, canProcessCancellation } from "@/lib/orders/cancellation";
import { formatKRW } from "@/lib/format";
import { CancellationActions } from "@/components/admin/cancellation-actions";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" }, { value: "requested", label: "접수" },
  { value: "refunded", label: "환불완료" }, { value: "rejected", label: "반려" },
];

export default async function AdminCancellationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const rows = await listCancellations(status || undefined);

  const toolbar = (
    <div className="flex gap-1">
      {FILTERS.map((f) => {
        const on = (status ?? "") === f.value;
        return (
          <Link key={f.value} href={f.value ? `/admin/orders/cancellations?status=${f.value}` : "/admin/orders/cancellations"}
            className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
            {f.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">취소/반품 관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">승인 시 토스 결제가 자동 환불되고 재고가 원복됩니다(전체취소 기준).</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        head={<><th className={TH}>유형</th><th className={TH}>주문번호</th><th className={TH}>사유</th><th className={TH}>환불예정</th><th className={TH}>상태</th><th className={`${TH} text-right`}>처리</th></>}
      >
        {rows.map((r) => (
          <tr key={r.id} className={`${ROW} align-top`}>
            <td className={`${TD} font-semibold`}>{REQUEST_TYPE_LABEL[r.type as keyof typeof REQUEST_TYPE_LABEL] ?? r.type}</td>
            <td className={TD}><Link href={`/admin/orders/${r.orderNumber}`} className="font-mono text-[var(--ad-accent)] hover:underline">{r.orderNumber}</Link></td>
            <td className={`${TD} max-w-[16rem] text-[var(--ad-mut)]`}><span className="line-clamp-2 whitespace-pre-wrap">{r.reason}</span></td>
            <td className={`${TD} font-mono`}>{formatKRW(r.totalAmount)}</td>
            <td className={TD}><StatusBadge value={r.status} /></td>
            <td className={`${TD} text-right`}>{canProcessCancellation(r.status) ? <CancellationActions id={r.id} /> : <span className="text-xs text-[var(--ad-mut-2)]">처리 완료</span>}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
