import Link from "next/link";
import { getStatusCounts, getDailyRevenue, getTopProducts, getCustomerOrderCounts } from "@/db/queries/admin-analytics";
import { summarizeCustomers } from "@/lib/admin/analytics-helpers";
import { statusLabel, ORDER_STATUSES } from "@/lib/admin/order-status";
import { countOpenInquiries } from "@/db/queries/admin-inquiries";
import { countRequestedCancellations } from "@/db/queries/admin-cancellations";
import { formatKRW } from "@/lib/format";
import { Kpi } from "@/components/admin/ui/kpi";
import { AdminCard } from "@/components/admin/ui/card";
import { RevenueChart } from "@/components/admin/ui/revenue-chart";
import { StatusBars } from "@/components/admin/ui/status-bars";
import { Donut } from "@/components/admin/ui/donut";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "#9AA39C", paid: "#2FB36B", preparing: "#2BB3B3",
  shipped: "#3B82F6", delivered: "#0F5132", cancelled: "#D9803F",
};

export default async function AdminDashboard() {
  const [statusCounts, daily, top, custRows, openInq, pendingCancel] = await Promise.all([
    getStatusCounts(), getDailyRevenue(14), getTopProducts(5), getCustomerOrderCounts(),
    countOpenInquiries(), countRequestedCancellations(),
  ]);
  const cust = summarizeCustomers(custRows);
  const revenueTotal = daily.reduce((s, d) => s + d.total, 0);
  const statusRows = ORDER_STATUSES.map((s) => ({ label: statusLabel(s), value: statusCounts[s] ?? 0, color: STATUS_COLOR[s] }));

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--ad-ink)]">운영 대시보드</h1>
      <p className="mb-5 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">핵심 지표와 처리 대기 항목을 한눈에</p>

      {(openInq > 0 || pendingCancel > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-3.5">
          <Pending n={openInq} title="미답변 문의" sub="고객 대기 중 — 답변 필요" href="/admin/inquiries?status=open" />
          <Pending n={pendingCancel} title="취소·반품 요청" sub="승인/반려 처리 대기" href="/admin/orders/cancellations?status=requested" />
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Kpi label="14일 매출" value={formatKRW(revenueTotal)} />
        <Kpi label="결제완료 주문" value={`${statusCounts.paid ?? 0}건`} />
        <Kpi label="구매 회원" value={`${cust.total}명`} />
        <Kpi label="재구매율" value={`${cust.repeatRate}%`} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <AdminCard title="매출 추이" tag="최근 14일 · ₩"><RevenueChart data={daily} /></AdminCard>
        <AdminCard title="주문 상태" tag={`${Object.values(statusCounts).reduce((a, b) => a + b, 0)}건`}>
          <StatusBars rows={statusRows} />
        </AdminCard>
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <AdminCard title="상품별 판매 TOP" tag="결제완료 기준">
          <ol>
            {top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-3 border-b border-[var(--ad-line-2)] py-[9px] last:border-0">
                <span className="w-5 font-mono text-xs font-bold text-[var(--ad-accent)]">0{i + 1}</span>
                <span className="flex-1 truncate text-[12.5px] text-[var(--ad-ink)]">{t.name}</span>
                <span className="font-mono text-[11px] text-[var(--ad-mut)]">{t.qty}개</span>
                <span className="w-[78px] text-right font-mono text-xs font-semibold text-[var(--ad-ink)]">{formatKRW(t.revenue)}</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-6 text-center text-sm text-[var(--ad-mut-2)]">데이터 없음</li>}
          </ol>
        </AdminCard>
        <AdminCard title="회원 구성" tag={`구매자 ${cust.total}`}>
          <div className="flex items-center gap-[18px] px-1 py-3.5">
            <Donut percent={cust.repeatRate} label="재구매율" />
            <div className="text-[13px] leading-[2.1]">
              <div><span className="text-[var(--ad-accent-2)]">●</span> 재구매 회원 <b className="font-mono">{cust.repeat}</b></div>
              <div><span className="text-[var(--ad-mut-2)]">●</span> 신규(1회) <b className="font-mono">{cust.newCustomers}</b></div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function Pending({ n, title, sub, href }: { n: number; title: string; sub: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 rounded-2xl border border-[#F0E2B0] bg-[#FFF8E6] px-[18px] py-3.5 transition hover:brightness-[0.98]">
      <span className="font-mono text-[26px] font-extrabold text-[#B7791F]">{n}</span>
      <span className="text-[13px] font-bold text-[var(--ad-ink)]">{title}<small className="mt-0.5 block font-normal text-[var(--ad-mut)]">{sub}</small></span>
      <span className="ml-auto text-lg text-[#B7791F]">→</span>
    </Link>
  );
}
