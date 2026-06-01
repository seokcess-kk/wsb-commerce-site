import Link from "next/link";
import { listAllOrders } from "@/db/queries/admin-orders";
import { STATUS_LABEL } from "@/lib/admin/order-status";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">주문관리</h1>
      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">주문번호</th>
            <th>상태</th>
            <th>주문자</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-stone-100">
              <td className="py-2">
                <Link
                  href={`/admin/orders/${o.orderNumber}`}
                  className="font-mono text-wsb-green hover:underline"
                >
                  {o.orderNumber}
                </Link>
              </td>
              <td>{STATUS_LABEL[o.status as keyof typeof STATUS_LABEL] ?? o.status}</td>
              <td>{o.customerName}</td>
              <td className="font-mono">{formatKRW(o.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">주문이 없습니다.</p>
      )}
    </div>
  );
}
