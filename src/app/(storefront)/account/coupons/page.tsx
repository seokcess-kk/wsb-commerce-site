import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listUserCoupons } from "@/db/queries/coupons";
import { couponLabel } from "@/lib/coupons/coupon-label";
import { formatDate } from "@/lib/format";
import { CouponRegisterForm } from "./coupon-register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "쿠폰함",
  robots: { index: false },
};

export default async function CouponsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/coupons");

  const userCoupons = await listUserCoupons(user.id);
  const available = userCoupons.filter((uc) => !uc.usedAt);
  const used = userCoupons.filter((uc) => !!uc.usedAt);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/account" className="text-sm text-wsb-green">
        ← 마이페이지
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-wsb-carbon">쿠폰함</h1>

      {/* Registration form */}
      <div className="mt-6 rounded-lg border border-stone-200 p-4">
        <h2 className="mb-3 text-sm font-bold text-wsb-carbon">쿠폰 코드 등록</h2>
        <CouponRegisterForm />
      </div>

      {/* Available coupons */}
      <h2 className="mt-8 mb-3 text-lg font-bold text-wsb-carbon">
        사용 가능한 쿠폰
        {available.length > 0 && (
          <span className="ml-2 text-base font-normal text-wsb-green">({available.length})</span>
        )}
      </h2>

      {available.length === 0 ? (
        <div className="rounded-lg border border-stone-200 py-10 text-center">
          <p className="text-sm text-stone-400">사용 가능한 쿠폰이 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {available.map((uc) => {
            const c = uc.coupon;
            const label = couponLabel(c);
            return (
              <li key={uc.userCouponId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-wsb-carbon truncate">{c.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-wsb-green">{label}</p>
                    {c.minSubtotal > 0 && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        최소 주문금액 ₩{c.minSubtotal.toLocaleString("ko-KR")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-semibold text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                      {c.code}
                    </span>
                    {c.endsAt && (
                      <p className="mt-1 text-xs text-stone-400">
                        ~{formatDate(c.endsAt)}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Used coupons */}
      {used.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-bold text-wsb-carbon">사용된 쿠폰</h2>
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-100">
            {used.map((uc) => {
              const c = uc.coupon;
              const label = couponLabel(c);
              return (
                <li key={uc.userCouponId} className="p-4 opacity-60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-500 truncate line-through">{c.name}</p>
                      <p className="mt-0.5 text-sm text-stone-400">{label}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs text-stone-400">{c.code}</span>
                      {uc.usedAt && (
                        <p className="mt-1 text-xs text-stone-400">
                          {formatDate(uc.usedAt)} 사용
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
