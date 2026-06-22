import { and, eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { getTossPaymentByOrderId } from "@/lib/payments/toss";
import { settlePaidOrder } from "@/lib/payments/settle";

export type ReconcileResult = { checked: number; settled: number; skipped: number; failed: number };

// 결제 승인(청구)은 성공했으나 로컬 정산(settlePaidOrder)이 실패해 주문이 pending 에 갇힌 경우를 복구한다.
// expire-virtual-accounts 가 가상계좌(WAITING_FOR_DEPOSIT)만 보는 것과 달리, 이 스윕은 결제수단과
// 무관하게 pending 주문을 토스에 직접 재조회해 DONE 이면 정산한다(카드/계좌이체/휴대폰 청구분 복구).
// settlePaidOrder 는 pending→paid 1회 멱등 가드라, 두 스윕이 같은 주문을 동시에 봐도 이중 정산·재차감되지 않는다.
const STALE_MS = 5 * 60 * 1000; // 진행 중인 결제(success 페이지)와의 레이스를 피하려 5분 지난 주문만 대상.

export async function reconcilePendingOrders(now: number = Date.now()): Promise<ReconcileResult> {
  const db = getDb();
  const cutoff = new Date(now - STALE_MS);
  const orders = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.status, "pending"), lt(schema.orders.createdAt, cutoff)));

  const result: ReconcileResult = { checked: 0, settled: 0, skipped: 0, failed: 0 };
  for (const order of orders) {
    result.checked++;
    try {
      const payment = await getTossPaymentByOrderId(order.orderNumber);
      if (payment.status === "DONE") {
        if (payment.totalAmount === order.totalAmount) {
          await settlePaidOrder(order, payment);
          result.settled++;
        } else {
          // 청구는 됐으나 금액 불일치 — 자동 정산하지 않고 운영자 확인 필요.
          result.failed++;
          console.error(
            `[reconcile] 금액 불일치 order=${order.orderNumber} paid=${payment.totalAmount} expected=${order.totalAmount}`,
          );
        }
      } else {
        // 미결제·입금 대기·취소 등 — 여기서 건드리지 않음(가상계좌 만료 스윕에 위임).
        result.skipped++;
      }
    } catch (e) {
      // 토스에 결제 기록이 없으면(주문만 만들고 결제 미진행) NOT_FOUND 로 throw → 정상 스킵.
      result.skipped++;
      const msg = (e as Error).message ?? "";
      if (!/NOT_FOUND|404/.test(msg)) {
        console.error(`[reconcile] order=${order.orderNumber} 조회 실패:`, e);
      }
    }
  }
  return result;
}
