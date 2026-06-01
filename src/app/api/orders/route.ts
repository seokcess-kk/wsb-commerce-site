import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { shippingFee } from "@/lib/checkout/pricing";
import { buildOrderNumber } from "@/lib/checkout/order-number";

type IncomingItem = { variantId: string; quantity: number };
type Body = {
  items: IncomingItem[];
  customer: { name: string; phone: string; email: string; address: string; zipcode?: string };
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body.items?.length) return NextResponse.json({ error: "장바구니가 비어 있습니다." }, { status: 400 });
  const { name, phone, email, address } = body.customer ?? {};
  if (!name || !phone || !email || !address) {
    return NextResponse.json({ error: "주문자 정보를 모두 입력해주세요." }, { status: 400 });
  }

  const db = getDb();
  const variantIds = body.items.map((i) => i.variantId);
  const variants = await db.select().from(schema.productVariants).where(inArray(schema.productVariants.id, variantIds));
  const productIds = [...new Set(variants.map((v) => v.productId))];
  const products = await db.select().from(schema.products).where(inArray(schema.products.id, productIds));
  const productOf = (id: string) => products.find((p) => p.id === id)!;

  let subtotal = 0;
  const itemRows = body.items.map((i) => {
    const v = variants.find((x) => x.id === i.variantId);
    if (!v) throw new Error(`존재하지 않는 옵션: ${i.variantId}`);
    const p = productOf(v.productId);
    const qty = Math.max(1, Math.floor(i.quantity));
    const unitPrice = p.basePrice + v.priceDelta;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    return { productId: p.id, variantId: v.id, productName: p.name, variantName: v.name, unitPrice, quantity: qty, lineTotal };
  });

  const ship = shippingFee(subtotal);
  const totalAmount = subtotal + ship;
  const orderNumber = buildOrderNumber(new Date(), Math.random().toString(36).slice(2, 6));

  const [order] = await db.insert(schema.orders).values({
    orderNumber, status: "pending",
    customerName: name, customerPhone: phone, customerEmail: email,
    shippingAddress: address, shippingZipcode: body.customer.zipcode ?? null,
    itemsSubtotal: subtotal, shippingFee: ship, totalAmount,
  }).returning();

  await db.insert(schema.orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id })));

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, amount: totalAmount });
}
