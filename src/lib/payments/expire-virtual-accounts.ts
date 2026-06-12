import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { getTossPaymentByOrderId } from "@/lib/payments/toss";
import { settlePaidOrder } from "@/lib/payments/settle";

export type SweepDecision = "settle" | "keep" | "cancel";

// 미입금 가상계좌 주문을, 토스가 보고하는 실제 결제 상태로 어떻게 처리할지 결정하는 순수 함수.
// 만료 판정을 우리 시계가 아니라 토스 상태에 위임한다(진실의 원천).
// - DONE: 웹훅을 놓친 입금을 뒤늦게 정산
// - WAITING_FOR_DEPOSIT: 아직 입금 기한 내 → 유지
// - 그 외(EXPIRED / CANCELED / ABORTED 등): 무효화(취소)
export function classifyDepositSweep(tossStatus: string): SweepDecision {
  if (tossStatus === "DONE") return "settle";
  if (tossStatus === "WAITING_FOR_DEPOSIT") return "keep";
  return "cancel";
}

export type SweepResult = {
  checked: number;
  settled: number;
  cancelled: number;
  kept: number;
  failed: number;
};

// 입금 대기 중인 가상계좌 주문을 일괄 점검한다. 각 주문을 토스에 재조회해
// 입금 완료는 정산, 만료/취소는 주문 무효화, 대기 중은 그대로 둔다.
export async function expireUnpaidVirtualAccounts(): Promise<SweepResult> {
  const db = getDb();

  // 입금 대기 결제 + 아직 pending 인 주문만 대상.
  const rows = await db
    .select({ order: schema.orders })
    .from(schema.payments)
    .innerJoin(schema.orders, eq(schema.payments.orderId, schema.orders.id))
    .where(and(eq(schema.payments.status, "WAITING_FOR_DEPOSIT"), eq(schema.orders.status, "pending")));

  const result: SweepResult = { checked: 0, settled: 0, cancelled: 0, kept: 0, failed: 0 };

  for (const { order } of rows) {
    result.checked++;
    try {
      const payment = await getTossPaymentByOrderId(order.orderNumber);
      const decision = classifyDepositSweep(payment.status);

      if (decision === "settle") {
        // 금액이 일치할 때만 정산(불일치는 보류하고 운영자에게 알림).
        if (payment.totalAmount === order.totalAmount) {
          await settlePaidOrder(order, payment);
          result.settled++;
        } else {
          result.failed++;
          console.error(`[expire-va] 금액 불일치 order=${order.orderNumber} paid=${payment.totalAmount} expected=${order.totalAmount}`);
        }
      } else if (decision === "cancel") {
        await cancelExpiredOrder(order.id, payment.status);
        result.cancelled++;
      } else {
        result.kept++;
      }
    } catch (e) {
      result.failed++;
      console.error(`[expire-va] order=${order.orderNumber} 처리 실패:`, e);
    }
  }

  return result;
}

// 미입금 만료 주문 무효화: pending → cancelled 조건부 전이(멱등) + payment 상태 갱신.
// 미입금이라 재고가 차감된 적이 없어 복구가 필요 없다.
async function cancelExpiredOrder(orderId: string, tossStatus: string): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.orders)
      .set({ status: "cancelled" })
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending")))
      .returning({ id: schema.orders.id });

    if (updated.length > 0) {
      await tx
        .update(schema.payments)
        .set({ status: tossStatus })
        .where(and(eq(schema.payments.orderId, orderId), eq(schema.payments.status, "WAITING_FOR_DEPOSIT")));
    }
  });
}
