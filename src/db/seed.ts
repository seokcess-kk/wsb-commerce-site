import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, like } from "drizzle-orm";
import { getDb, schema } from "./index";

const NOTICE = "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";
const PAID_LIKE = ["paid", "preparing", "shipped", "delivered"];

// 데모 기준일(=오늘). 주문을 이 날짜에서 N일 전으로 분산해 대시보드 일별 매출 그래프를 채운다.
const BASE = new Date("2026-06-08T01:00:00Z"); // 약 KST 오전 10시
function daysAgo(n: number): Date {
  const d = new Date(BASE);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

const CATEGORIES = [
  { slug: "brain-focus", name: "두뇌·집중", sortOrder: 1 },
  { slug: "immune", name: "면역", sortOrder: 2 },
  { slug: "sleep", name: "수면", sortOrder: 3 },
  { slug: "vitality", name: "활력", sortOrder: 4 },
];

// 마이페이지 확인용으로 일부 주문을 연결할 어드민 유저(admin@glitzy.kr).
const ADMIN_USER_ID = "33c9fbd0-0ac6-4d1d-be57-e4df12dba33b";
// FK 없는 단순 uuid — 회원/재구매 지표 다양화용 가짜 고객.
const CUST = {
  kim: "11111111-1111-4111-8111-111111111111",
  lee: "22222222-2222-4222-8222-222222222222",
  park: "33333333-3333-4333-8333-333333333333",
};

const BANNERS = [
  { title: "Sharper mind, brighter day. — NUTROGIN 신제품 출시", imageUrl: "/banners/nutrogin-hero.png", linkUrl: "/category/brain-focus", sortOrder: 1, isActive: true },
  { title: "여름 면역 케어 기획전 · 최대 20% 할인", imageUrl: "/banners/immune-event.png", linkUrl: "/category/immune", sortOrder: 2, isActive: true },
  { title: "5만원 이상 구매 시 무료배송", imageUrl: "/banners/free-shipping.png", linkUrl: "/products", sortOrder: 3, isActive: true },
];

function product(slug: string, name: string, brand: string, catSlug: string, basePrice: number, summary: string, extra: Partial<Record<string, string>> = {}) {
  return {
    slug, name, brand, catSlug, basePrice, summary,
    reviewPhraseNo: `제2026-${slug.toUpperCase()}-001`,
    noticeText: NOTICE,
    reportNo: extra.reportNo ?? "제2026-0000000000호",
    functionality: extra.functionality ?? "건강 유지에 도움을 줄 수 있음",
    intakeNotice: extra.intakeNotice ?? "정해진 섭취량을 지키십시오. 이상사례 발생 시 섭취를 중단하고 전문가와 상담하십시오.",
    ingredients: extra.ingredients ?? "주원료 농축액, 비타민·미네랄",
    images: [`/products/${slug}.png`],
    isPublished: true,
  };
}

const PRODUCTS = [
  product("nutrogin-focus", "NUTROGIN FOCUS 브레인케어 스틱", "NUTROGIN", "brain-focus", 39000, "데이터로 키운 진세노사이드 브레인케어, 하루 한 스틱.", { reportNo: "제2026-0000000001호", functionality: "인지능력 개선에 도움을 줄 수 있음(개별인정형 예시)", intakeNotice: "임산부·수유부·어린이는 섭취에 주의. 이상사례 발생 시 섭취 중단.", ingredients: "홍삼농축액 70%(진세노사이드 Rg1+Rb1+Rg3), 비타민 B군" }),
  product("nutrogin-clear", "NUTROGIN CLEAR 스틱", "NUTROGIN", "brain-focus", 39000, "맑은 하루를 위한 브레인케어.", { reportNo: "제2026-0000000002호", functionality: "피로 개선에 도움을 줄 수 있음", ingredients: "홍삼농축액, 아연" }),
  product("nutrogin-rest", "NUTROGIN REST 스틱", "NUTROGIN", "sleep", 39000, "깊은 휴식을 위한 나이트 케어.", { reportNo: "제2026-0000000003호", functionality: "수면의 질 개선에 도움을 줄 수 있음", intakeNotice: "취침 전 섭취. 운전 전 섭취 주의.", ingredients: "테아닌, 락티움" }),
  product("wsb-immune-balance", "WSB 이뮨 밸런스", "WSB", "immune", 28000, "일상 면역 케어.", { reportNo: "제2026-0000000010호", functionality: "면역력 증진에 도움을 줄 수 있음", intakeNotice: "알레르기 체질은 원료 확인.", ingredients: "아연, 비타민C, 홍삼" }),
  product("wsb-vita-day", "WSB 비타 데이", "WSB", "vitality", 22000, "하루 활력 멀티비타민.", { reportNo: "제2026-0000000011호", functionality: "피로 개선에 도움을 줄 수 있음", intakeNotice: "1일 1회 1포.", ingredients: "비타민 B·C·D, 미네랄" }),
  product("wsb-propolis-guard", "WSB 프로폴리스 가드", "WSB", "immune", 32000, "환절기 목·면역 케어 프로폴리스.", { reportNo: "제2026-0000000012호", functionality: "항산화·구강 항균에 도움을 줄 수 있음", ingredients: "프로폴리스 추출물, 비타민C" }),
  product("wsb-omega3", "WSB 트리플 오메가3", "WSB", "vitality", 26000, "혈행·기억력 케어 rTG 오메가3.", { reportNo: "제2026-0000000013호", functionality: "혈중 중성지방 개선·혈행 개선에 도움을 줄 수 있음", ingredients: "정제어유(EPA·DHA), 비타민E" }),
  product("wsb-sleep-therapy", "WSB 슬립 테라피", "WSB", "sleep", 30000, "편안한 밤을 위한 수면 케어.", { reportNo: "제2026-0000000014호", functionality: "수면의 질 개선에 도움을 줄 수 있음", intakeNotice: "취침 30분 전 섭취.", ingredients: "감태추출물, GABA, 테아닌" }),
  product("wsb-probiotics", "WSB 프로바이오 데일리", "WSB", "immune", 24000, "장 건강 데일리 유산균 100억 CFU.", { reportNo: "제2026-0000000015호", functionality: "유산균 증식·유해균 억제·배변활동 원활에 도움을 줄 수 있음", ingredients: "프로바이오틱스 혼합 분말, 프리바이오틱스" }),
  product("wsb-lutein-eye", "WSB 루테인 아이케어", "WSB", "vitality", 27000, "눈 건강 루테인·지아잔틴.", { reportNo: "제2026-0000000016호", functionality: "노화로 인해 감소될 수 있는 황반색소밀도 유지에 도움을 줄 수 있음", ingredients: "마리골드추출물(루테인), 비타민A" }),
];

type DemoItem = { slug: string; v: 0 | 1; qty: number };
type DemoOrder = {
  no: string; status: string; days: number; userId: string | null;
  name: string; phone: string; email: string; addr: string; zip: string;
  items: DemoItem[]; courier?: string; tracking?: string;
};

const CJ = "CJ대한통운";
const ORDERS: DemoOrder[] = [
  { no: "DEMO-0001", status: "delivered", days: 13, userId: ADMIN_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-focus", v: 1, qty: 1 }], courier: CJ, tracking: "640012345001" },
  { no: "DEMO-0002", status: "delivered", days: 12, userId: CUST.kim, name: "김지후", phone: "010-2000-0002", email: "kim@example.com", addr: "경기도 성남시 분당구 판교로 22", zip: "13529", items: [{ slug: "wsb-immune-balance", v: 0, qty: 2 }], courier: CJ, tracking: "640012345002" },
  { no: "DEMO-0003", status: "shipped", days: 10, userId: ADMIN_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-rest", v: 0, qty: 1 }, { slug: "wsb-vita-day", v: 0, qty: 1 }], courier: "한진택배", tracking: "508800012003" },
  { no: "DEMO-0004", status: "paid", days: 9, userId: CUST.lee, name: "이서연", phone: "010-3000-0003", email: "lee@example.com", addr: "부산광역시 해운대구 센텀로 33", zip: "48058", items: [{ slug: "wsb-vita-day", v: 0, qty: 1 }] },
  { no: "DEMO-0005", status: "preparing", days: 8, userId: ADMIN_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-clear", v: 1, qty: 1 }] },
  { no: "DEMO-0006", status: "delivered", days: 7, userId: CUST.park, name: "박도윤", phone: "010-4000-0004", email: "park@example.com", addr: "대전광역시 유성구 대학로 99", zip: "34141", items: [{ slug: "wsb-omega3", v: 0, qty: 2 }], courier: CJ, tracking: "640012345006" },
  { no: "DEMO-0007", status: "shipped", days: 6, userId: CUST.kim, name: "김지후", phone: "010-2000-0002", email: "kim@example.com", addr: "경기도 성남시 분당구 판교로 22", zip: "13529", items: [{ slug: "nutrogin-focus", v: 0, qty: 1 }, { slug: "wsb-immune-balance", v: 0, qty: 1 }], courier: CJ, tracking: "640012345007" },
  { no: "DEMO-0008", status: "cancelled", days: 6, userId: null, name: "최비회원", phone: "010-5000-0005", email: "guest1@example.com", addr: "광주광역시 서구 상무대로 12", zip: "61945", items: [{ slug: "wsb-vita-day", v: 0, qty: 1 }] },
  { no: "DEMO-0009", status: "paid", days: 5, userId: null, name: "정게스트", phone: "010-6000-0006", email: "guest2@example.com", addr: "인천광역시 연수구 송도과학로 7", zip: "21984", items: [{ slug: "wsb-sleep-therapy", v: 0, qty: 1 }] },
  { no: "DEMO-0010", status: "delivered", days: 4, userId: ADMIN_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-focus", v: 0, qty: 2 }], courier: CJ, tracking: "640012345010" },
  { no: "DEMO-0011", status: "preparing", days: 3, userId: CUST.lee, name: "이서연", phone: "010-3000-0003", email: "lee@example.com", addr: "부산광역시 해운대구 센텀로 33", zip: "48058", items: [{ slug: "wsb-probiotics", v: 0, qty: 1 }] },
  { no: "DEMO-0012", status: "paid", days: 2, userId: CUST.park, name: "박도윤", phone: "010-4000-0004", email: "park@example.com", addr: "대전광역시 유성구 대학로 99", zip: "34141", items: [{ slug: "nutrogin-clear", v: 0, qty: 1 }] },
  { no: "DEMO-0013", status: "pending", days: 1, userId: null, name: "한대기", phone: "010-7000-0007", email: "guest3@example.com", addr: "울산광역시 남구 삼산로 50", zip: "44705", items: [{ slug: "nutrogin-rest", v: 0, qty: 1 }] },
  { no: "DEMO-0014", status: "pending", days: 0, userId: null, name: "오신규", phone: "010-8000-0008", email: "guest4@example.com", addr: "서울특별시 마포구 양화로 45", zip: "04039", items: [{ slug: "wsb-vita-day", v: 0, qty: 2 }] },
  { no: "DEMO-0015", status: "delivered", days: 0, userId: CUST.kim, name: "김지후", phone: "010-2000-0002", email: "kim@example.com", addr: "경기도 성남시 분당구 판교로 22", zip: "13529", items: [{ slug: "wsb-lutein-eye", v: 0, qty: 1 }, { slug: "wsb-vita-day", v: 0, qty: 1 }], courier: CJ, tracking: "640012345015" },
];

async function main() {
  const db = getDb();

  // 1) 카테고리
  await db.insert(schema.categories).values(CATEGORIES).onConflictDoNothing({ target: schema.categories.slug });
  const cats = await db.select().from(schema.categories);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  // 2) 상품 (slug 기준 멱등)
  await db
    .insert(schema.products)
    .values(PRODUCTS.map(({ catSlug, ...p }) => ({ ...p, categoryId: catId(catSlug) })))
    .onConflictDoNothing({ target: schema.products.slug });

  // 3) 옵션 — variant 없는 상품에만 생성 (멱등)
  const products = await db.select().from(schema.products);
  for (const p of products) {
    const has = await db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, p.id));
    if (has.length === 0) {
      await db.insert(schema.productVariants).values([
        { productId: p.id, name: "1박스 (10스틱)", sku: `${p.slug}-1`, priceDelta: 0, stock: 100, sortOrder: 1 },
        { productId: p.id, name: "3박스 세트", sku: `${p.slug}-3`, priceDelta: Math.round(p.basePrice * 2.7) - p.basePrice, stock: 50, sortOrder: 2 },
      ]);
    }
  }

  // 4) 배너 — 데모 전용이므로 전체 교체
  await db.delete(schema.banners);
  await db.insert(schema.banners).values(BANNERS);

  // 5) 데모 주문 — DEMO-% 네임스페이스 멱등 재생성 (order_items·payments는 cascade 삭제)
  await db.delete(schema.orders).where(like(schema.orders.orderNumber, "DEMO-%"));

  const variants = await db.select().from(schema.productVariants);
  const bySlug = (slug: string) => products.find((p) => p.slug === slug)!;
  const variantsOf = (pid: string) => variants.filter((v) => v.productId === pid).sort((a, b) => a.sortOrder - b.sortOrder);

  for (const o of ORDERS) {
    const itemRows = o.items.map((it) => {
      const p = bySlug(it.slug);
      const vs = variantsOf(p.id);
      const v = vs[it.v] ?? vs[0];
      const unitPrice = p.basePrice + v.priceDelta;
      return { productId: p.id, variantId: v.id, productName: p.name, variantName: v.name, unitPrice, quantity: it.qty, lineTotal: unitPrice * it.qty };
    });
    const subtotal = itemRows.reduce((s, r) => s + r.lineTotal, 0);
    const ship = subtotal >= 50000 ? 0 : 3000;
    const total = subtotal + ship;
    const createdAt = daysAgo(o.days);

    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: o.no, status: o.status, userId: o.userId,
        customerName: o.name, customerPhone: o.phone, customerEmail: o.email,
        shippingAddress: o.addr, shippingZipcode: o.zip,
        itemsSubtotal: subtotal, shippingFee: ship, totalAmount: total,
        courier: o.courier ?? null, trackingNumber: o.tracking ?? null,
        createdAt,
      })
      .returning();

    await db.insert(schema.orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id, createdAt })));

    if (PAID_LIKE.includes(o.status)) {
      await db.insert(schema.payments).values({
        orderId: order.id, provider: "toss", paymentKey: `demo_pay_${o.no}`,
        method: "카드", amount: total, status: "DONE", approvedAt: createdAt, createdAt,
      });
    }
  }

  console.log(`seed 완료: categories=${cats.length}, products=${products.length}, banners=${BANNERS.length}, orders=${ORDERS.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
