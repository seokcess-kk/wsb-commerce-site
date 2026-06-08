import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOrdersByUser } from "@/db/queries/orders";
import { formatKRW } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/admin/order-status";

export const dynamic = "force-dynamic";

const statusLabel = (s: string) => (STATUS_LABEL as Record<string, string>)[s] ?? s;

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orders = await listOrdersByUser(user.id);
  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-wsb-carbon">마이페이지</h1>
        <Link href="/account/profile" className="text-sm font-semibold text-wsb-green hover:underline">회원정보 수정</Link>
      </div>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>
      <h2 className="mt-8 mb-3 text-lg font-bold text-wsb-carbon">주문 내역</h2>
      {orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-500">주문 내역이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between p-4">
              <div>
                <Link href={`/account/orders/${o.orderNumber}`} className="font-mono text-sm font-semibold text-wsb-green hover:underline">
                  {o.orderNumber}
                </Link>
                <p className="mt-0.5 text-xs text-stone-500">{statusLabel(o.status)}</p>
              </div>
              <span className="font-mono text-sm font-bold">{formatKRW(o.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
