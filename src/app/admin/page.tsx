import { getStatusCounts, getDailyRevenue, getTopProducts, getCustomerOrderCounts } from "@/db/queries/admin-analytics";
import { summarizeCustomers } from "@/lib/admin/analytics-helpers";
import { STATUS_LABEL } from "@/lib/admin/order-status";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [statusCounts, daily, top, custRows] = await Promise.all([
    getStatusCounts(), getDailyRevenue(14), getTopProducts(5), getCustomerOrderCounts(),
  ]);
  const cust = summarizeCustomers(custRows);
  const revenueTotal = daily.reduce((s, d) => s + d.total, 0);
  const maxDay = Math.max(1, ...daily.map((d) => d.total));
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">대시보드</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="최근 14일 매출" value={formatKRW(revenueTotal)} />
        <Kpi label="결제완료 주문" value={`${statusCounts.paid ?? 0}건`} />
        <Kpi label="회원(구매)" value={`${cust.total}명`} />
        <Kpi label="재구매율" value={`${cust.repeatRate}%`} />
      </div>
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="매출 추이 (최근 14일)">
          <ul className="space-y-1">
            {daily.map((d) => (
              <li key={d.day} className="flex items-center gap-2 text-xs">
                <span className="w-20 font-mono text-stone-500">{d.day.slice(5)}</span>
                <span className="h-2 rounded bg-wsb-green" style={{ width: `${Math.round((d.total / maxDay) * 100)}%` }} />
                <span className="font-mono text-stone-600">{formatKRW(d.total)}</span>
              </li>
            ))}
            {daily.length === 0 && <li className="text-sm text-stone-400">데이터 없음</li>}
          </ul>
        </Card>
        <Card title="주문 상태 현황">
          <ul className="space-y-1 text-sm">
            {Object.entries(STATUS_LABEL).map(([k, label]) => (
              <li key={k} className="flex justify-between"><span className="text-stone-500">{label}</span><span className="font-mono font-bold">{statusCounts[k] ?? 0}</span></li>
            ))}
          </ul>
        </Card>
        <Card title="상품별 판매 TOP">
          <ol className="space-y-1 text-sm">
            {top.map((t, i) => (
              <li key={t.name} className="flex justify-between"><span className="truncate">{i + 1}. {t.name}</span><span className="font-mono">{t.qty}개 · {formatKRW(t.revenue)}</span></li>
            ))}
            {top.length === 0 && <li className="text-stone-400">데이터 없음</li>}
          </ol>
        </Card>
        <Card title="회원">
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span className="text-stone-500">구매 회원 수</span><span className="font-mono font-bold">{cust.total}</span></li>
            <li className="flex justify-between"><span className="text-stone-500">재구매 회원</span><span className="font-mono font-bold">{cust.repeat}</span></li>
            <li className="flex justify-between"><span className="text-stone-500">신규(1회)</span><span className="font-mono font-bold">{cust.newCustomers}</span></li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-stone-200 p-4"><p className="font-mono text-[11px] uppercase tracking-wide text-stone-400">{label}</p><p className="mt-1 text-xl font-extrabold text-wsb-carbon">{value}</p></div>;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-stone-200 p-5"><h2 className="mb-3 text-sm font-bold text-wsb-carbon">{title}</h2>{children}</div>;
}
