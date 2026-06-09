import Link from "next/link";
import { listCouponsWithStats } from "@/db/queries/admin-coupons";
import { formatKRW, formatDate } from "@/lib/format";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponDeleteButton } from "@/components/admin/coupon-delete-button";
import { toggleCoupon } from "./actions";

export const dynamic = "force-dynamic";

function discountText(type: string, value: number): string {
  return type === "rate" ? `${value}%` : formatKRW(value);
}

function periodText(startsAt: Date | null, endsAt: Date | null): string {
  if (!startsAt && !endsAt) return "상시";
  return `${startsAt ? formatDate(startsAt) : "~"} – ${endsAt ? formatDate(endsAt) : "~"}`;
}

export default async function AdminCouponsPage() {
  const coupons = await listCouponsWithStats();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">쿠폰관리</h1>
      <p className="mt-1 text-sm text-stone-500">
        생성한 코드를 고객이 마이페이지에서 등록해 받습니다.
      </p>

      <div className="mt-5">
        <CouponForm />
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">코드</th>
            <th>이름</th>
            <th>할인</th>
            <th>최소주문</th>
            <th>기간</th>
            <th>발급/사용</th>
            <th>상태</th>
            <th className="text-right">관리</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => {
            async function handleToggle() {
              "use server";
              await toggleCoupon(c.id, !c.isActive);
            }
            return (
              <tr key={c.id} className="border-b border-stone-100">
                <td className="py-2 font-mono font-semibold text-wsb-carbon">{c.code}</td>
                <td>{c.name}</td>
                <td className="font-mono">{discountText(c.discountType, c.discountValue)}</td>
                <td className="font-mono text-xs">{c.minSubtotal > 0 ? formatKRW(c.minSubtotal) : "-"}</td>
                <td className="text-xs text-stone-500">{periodText(c.startsAt, c.endsAt)}</td>
                <td className="font-mono text-xs">
                  {c.issued} / {c.used}
                </td>
                <td>
                  {c.isActive ? (
                    <span className="text-wsb-green">활성</span>
                  ) : (
                    <span className="text-stone-400">비활성</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/coupons/${c.id}`}
                      className="rounded-md border border-wsb-green px-2 py-1 text-xs font-semibold text-wsb-green hover:bg-wsb-green/5"
                    >
                      수정
                    </Link>
                    <form action={handleToggle}>
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                      >
                        {c.isActive ? "비활성" : "활성"}
                      </button>
                    </form>
                    <CouponDeleteButton id={c.id} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {coupons.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">등록된 쿠폰이 없습니다.</p>
      )}
    </div>
  );
}
