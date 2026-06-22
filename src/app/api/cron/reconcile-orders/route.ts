import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { reconcilePendingOrders } from "@/lib/payments/reconcile";

export const dynamic = "force-dynamic";

// 정산 누락 복구 스윕. 결제 승인은 됐으나 로컬 정산이 실패해 pending 에 갇힌 주문을
// 토스에 재조회해 마무리한다(카드/계좌이체/휴대폰 포함). Vercel Cron(vercel.json)이 호출한다.
// CRON_SECRET 이 설정돼 있으면 `Authorization: Bearer <CRON_SECRET>` 를 검증한다(프로덕션 필수).
export async function GET(req: Request) {
  const secret = getEnv().CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await reconcilePendingOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/reconcile-orders] error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
