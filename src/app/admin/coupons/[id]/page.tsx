import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoupon } from "@/db/queries/admin-coupons";
import { CouponForm } from "@/components/admin/coupon-form";

export const dynamic = "force-dynamic";

export default async function AdminCouponEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCoupon(id);
  if (!coupon) notFound();

  return (
    <div>
      <Link href="/admin/coupons" className="text-sm text-wsb-green">
        ← 쿠폰관리
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-wsb-carbon">쿠폰 수정</h1>
      <div className="mt-5">
        <CouponForm
          initial={{
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minSubtotal: coupon.minSubtotal,
            maxDiscount: coupon.maxDiscount,
            startsAt: coupon.startsAt,
            endsAt: coupon.endsAt,
            isActive: coupon.isActive,
          }}
        />
      </div>
    </div>
  );
}
