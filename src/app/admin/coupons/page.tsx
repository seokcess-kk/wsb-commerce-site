import Link from "next/link";
import { listCouponsWithStats } from "@/db/queries/admin-coupons";
import { formatKRW, formatDate } from "@/lib/format";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponDeleteButton } from "@/components/admin/coupon-delete-button";
import { toggleCoupon } from "./actions";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const discountText = (t: string, v: number) => (t === "rate" ? `${v}%` : formatKRW(v));
const periodText = (s: Date | null, e: Date | null) => (!s && !e ? "상시" : `${s ? formatDate(s) : "~"} – ${e ? formatDate(e) : "~"}`);

export default async function AdminCouponsPage() {
  const coupons = await listCouponsWithStats();
  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">쿠폰관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">생성한 코드를 고객이 마이페이지에서 등록해 받습니다.</p>
      <div className="mb-5"><CouponForm /></div>
      <DataTable
        empty={coupons.length === 0}
        head={<><th className={TH}>코드</th><th className={TH}>이름</th><th className={TH}>할인</th><th className={TH}>최소주문</th><th className={TH}>기간</th><th className={TH}>발급/사용</th><th className={TH}>상태</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {coupons.map((c) => {
          async function onToggle() { "use server"; await toggleCoupon(c.id, !c.isActive); }
          return (
            <tr key={c.id} className={ROW}>
              <td className={`${TD} font-mono font-semibold`}>{c.code}</td>
              <td className={TD}>{c.name}</td>
              <td className={`${TD} font-mono`}>{discountText(c.discountType, c.discountValue)}</td>
              <td className={`${TD} font-mono text-xs`}>{c.minSubtotal > 0 ? formatKRW(c.minSubtotal) : "-"}</td>
              <td className={`${TD} text-xs text-[var(--ad-mut)]`}>{periodText(c.startsAt, c.endsAt)}</td>
              <td className={`${TD} font-mono text-xs`}>{c.issued} / {c.used}</td>
              <td className={TD}>{c.isActive ? <StatusBadge value="visible" label="활성" /> : <StatusBadge value="hidden" label="비활성" />}</td>
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/coupons/${c.id}`}><AdminButton variant="ghost" className="!py-1 !text-xs">수정</AdminButton></Link>
                  <form action={onToggle}><AdminButton variant="ghost" className="!py-1 !text-xs">{c.isActive ? "비활성" : "활성"}</AdminButton></form>
                  <CouponDeleteButton id={c.id} />
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
