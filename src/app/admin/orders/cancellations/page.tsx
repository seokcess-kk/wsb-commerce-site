import Link from "next/link";
import { listCancellations } from "@/db/queries/admin-cancellations";
import {
  REQUEST_TYPE_LABEL,
  cancellationStatusLabel,
  canProcessCancellation,
} from "@/lib/orders/cancellation";
import { formatKRW } from "@/lib/format";
import { CancellationActions } from "@/components/admin/cancellation-actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "requested", label: "접수" },
  { value: "refunded", label: "환불완료" },
  { value: "rejected", label: "반려" },
] as const;

export default async function AdminCancellationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const rows = await listCancellations(status || undefined);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">취소/반품 관리</h1>
      <p className="mt-1 text-sm text-stone-500">
        승인 시 토스 결제가 자동 환불되고 재고가 원복됩니다(전체취소 기준).
      </p>

      <nav className="mt-4 flex gap-1 text-sm">
        {FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/orders/cancellations?status=${f.value}` : "/admin/orders/cancellations"}
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
            <th className="py-2">유형</th>
            <th>주문번호</th>
            <th>사유</th>
            <th>환불예정</th>
            <th>상태</th>
            <th>요청일</th>
            <th className="text-right">처리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-stone-100 align-top">
              <td className="py-3 font-semibold text-wsb-carbon">
                {REQUEST_TYPE_LABEL[r.type as keyof typeof REQUEST_TYPE_LABEL] ?? r.type}
              </td>
              <td className="py-3">
                <Link href={`/admin/orders/${r.orderNumber}`} className="font-mono text-wsb-green hover:underline">
                  {r.orderNumber}
                </Link>
              </td>
              <td className="max-w-[16rem] py-3 text-stone-600">
                <span className="line-clamp-2 whitespace-pre-wrap">{r.reason}</span>
              </td>
              <td className="py-3 font-mono">{formatKRW(r.totalAmount)}</td>
              <td className="py-3">{cancellationStatusLabel(r.status)}</td>
              <td className="py-3 font-mono text-xs text-stone-500">
                {r.createdAt.toISOString().slice(0, 10)}
              </td>
              <td className="py-3 text-right">
                {canProcessCancellation(r.status) ? (
                  <CancellationActions id={r.id} />
                ) : (
                  <span className="text-xs text-stone-400">처리 완료</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">해당하는 요청이 없습니다.</p>
      )}
    </div>
  );
}
