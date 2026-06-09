"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { getCurrentUser } from "@/lib/auth/current-user";
import { availableRequestTypes, type RequestType } from "@/lib/orders/cancellation";

export async function requestCancellation(
  orderNumber: string,
  type: RequestType,
  reason: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.orderNumber, orderNumber),
        eq(schema.orders.userId, user.id),
      ),
    )
    .limit(1);

  if (!order) {
    return { error: "주문을 찾을 수 없습니다." };
  }

  const allowed = availableRequestTypes(order.status);
  if (!allowed.includes(type)) {
    return { error: `현재 상태(${order.status})에서는 ${type} 요청이 불가합니다.` };
  }

  await db.insert(schema.orderCancellations).values({
    orderId: order.id,
    userId: user.id,
    type,
    reason,
    status: "requested",
  });

  revalidatePath(`/account/orders/${orderNumber}`);

  return {};
}
