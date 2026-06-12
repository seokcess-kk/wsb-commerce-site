import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { expireUnpaidVirtualAccounts } from "@/lib/payments/expire-virtual-accounts";

export const dynamic = "force-dynamic";

// 미입금 가상계좌 주문 만료 스윕. Vercel Cron(vercel.json)이 주기적으로 호출한다.
// Vercel Cron 은 CRON_SECRET 이 설정돼 있으면 `Authorization: Bearer <CRON_SECRET>` 를 자동으로 붙인다.
// CRON_SECRET 미설정 시(로컬 개발 등)에는 인증을 건너뛴다 — 프로덕션에서는 반드시 설정할 것.
export async function GET(req: Request) {
  const secret = getEnv().CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await expireUnpaidVirtualAccounts();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/expire-virtual-accounts] error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
