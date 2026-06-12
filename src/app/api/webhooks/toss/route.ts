import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { getTossPaymentByOrderId } from "@/lib/payments/toss";
import { decideDepositAction, settlePaidOrder } from "@/lib/payments/settle";

export const dynamic = "force-dynamic";

// 토스페이먼츠 가상계좌 입금 콜백(DEPOSIT_CALLBACK).
// 구매자가 발급된 가상계좌에 실제 입금하면 토스가 이 엔드포인트로 POST 한다.
// 토스 콘솔 > 웹훅에 `<배포 도메인>/api/webhooks/toss` 를 DEPOSIT_CALLBACK 이벤트로 등록할 것.
//
// 본문 예: { createdAt, secret, status: "DONE"|"CANCELED", transactionKey, orderId }
// 본문은 신뢰하지 않는다 — orderId 만 취하고 토스 결제 조회 API로 실제 상태·금액을 재확인한다.
type DepositCallback = { orderId?: string; status?: string };

export async function POST(req: Request) {
  let body: DepositCallback;
  try {
    body = (await req.json()) as DepositCallback;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const orderId = body.orderId;
  if (!orderId) return NextResponse.json({ ok: false, error: "missing orderId" }, { status: 400 });

  try {
    // 서버 대 서버 재확인 — 위조된 웹훅으로는 결제 조회가 일치하지 않는다.
    const payment = await getTossPaymentByOrderId(orderId);

    const db = getDb();
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.orderNumber, orderId))
      .limit(1);

    // 우리 주문이 아니면 200으로 ack 해 토스의 재시도를 멈춘다(일시 오류만 재시도 대상).
    if (!order) return NextResponse.json({ ok: true });

    const action = decideDepositAction(payment.status, payment.totalAmount, order.totalAmount);
    if (action === "settle") {
      await settlePaidOrder(order, payment);
    } else if (action === "amount_mismatch") {
      console.error(
        `[toss webhook] 금액 불일치 order=${orderId} paid=${payment.totalAmount} expected=${order.totalAmount}`,
      );
    }
    // ignore(입금 취소 등)는 운영자가 주문관리에서 처리. 여기서는 ack.
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 일시적 오류(토스 조회 실패/DB 오류)는 5xx 로 응답해 토스가 재시도하게 둔다.
    console.error("[toss webhook] error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
