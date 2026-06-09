import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { buildOrderNumber } from "@/lib/checkout/order-number";
import { parseQuantity } from "@/lib/checkout/quantity";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getApplicableCoupon } from "@/db/queries/coupons";
import { orderTotal, shippingFee } from "@/lib/checkout/pricing";

type IncomingItem = { variantId: string; quantity: unknown };
type Body = {
  items: IncomingItem[];
  customer: { name: string; phone: string; email: string; address: string; zipcode?: string };
  couponCode?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!body.items?.length) return NextResponse.json({ error: "장바구니가 비어 있습니다." }, { status: 400 });
  const { name, phone, email, address } = body.customer ?? {};
  if (!name || !phone || !email || !address) {
    return NextResponse.json({ error: "주문자 정보를 모두 입력해주세요." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const db = getDb();
    const variantIds = body.items.map((i) => i.variantId);
    const variants = await db.select().from(schema.productVariants).where(inArray(schema.productVariants.id, variantIds));
    const productIds = [...new Set(variants.map((v) => v.productId))];
    const products = await db.select().from(schema.products).where(inArray(schema.products.id, productIds));
    const productOf = (id: string) => products.find((p) => p.id === id)!;

    let subtotal = 0;
    const itemRows = [];
    for (const i of body.items) {
      const qty = parseQuantity(i.quantity);
      if (qty === null) return NextResponse.json({ error: "수량이 올바르지 않습니다." }, { status: 400 });

      const v = variants.find((x) => x.id === i.variantId);
      if (!v) return NextResponse.json({ error: "존재하지 않는 옵션이 포함되어 있습니다." }, { status: 400 });

      // NOTE: This is a best-effort guard only, not concurrency-safe.
      // Atomic stock decrement/reservation is deferred to a later plan.
      if (v.stock <= 0) return NextResponse.json({ error: "품절된 상품이 포함되어 있습니다." }, { status: 400 });

      const p = productOf(v.productId);
      const unitPrice = p.basePrice + v.priceDelta;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      itemRows.push({ productId: p.id, variantId: v.id, productName: p.name, variantName: v.name, unitPrice, quantity: qty, lineTotal });
    }

    // ── Coupon lookup & server-side recompute ────────────────────────────────
    // NEVER trust a client-sent discount amount — always recompute from DB.
    // Coupons require ownership verification: only logged-in users who have
    // claimed the coupon and not yet used it may apply it (guests: discount=0).
    let appliedCouponCode: string | null = null;
    let discount = 0;

    if (body.couponCode && user) {
      const result = await getApplicableCoupon(user.id, body.couponCode, subtotal, new Date());
      if (result.ok) {
        discount = result.discount;
        appliedCouponCode = result.code;
      }
      // If not ok (not owned, already used, invalid, min subtotal) — silently
      // ignore the coupon and proceed with discount=0. Order still succeeds.
    }
    // Guest checkout: couponCode ignored entirely (discount remains 0).

    const totalAmount = orderTotal(subtotal, discount);
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const ship = shippingFee(discountedSubtotal);

    const orderNumber = buildOrderNumber(new Date(), Math.random().toString(36).slice(2, 6));

    const [order] = await db.insert(schema.orders).values({
      orderNumber, status: "pending",
      customerName: name, customerPhone: phone, customerEmail: email,
      shippingAddress: address, shippingZipcode: body.customer.zipcode ?? null,
      itemsSubtotal: subtotal,
      shippingFee: ship,
      totalAmount,
      couponCode: appliedCouponCode,
      couponDiscount: discount,
      userId: user?.id ?? null,
    }).returning();

    await db.insert(schema.orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id })));

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, amount: totalAmount });
  } catch (e) {
    console.error("[POST /api/orders] unexpected error:", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
