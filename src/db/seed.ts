import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, like, or, sql } from "drizzle-orm";
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
// DEMO_USER_ID: 환경변수로 재정의 가능. 기본값은 ADMIN_USER_ID.
const DEMO_USER_ID = process.env.SEED_DEMO_USER_ID ?? ADMIN_USER_ID;
// FK 없는 단순 uuid — 회원/재구매 지표 다양화용 가짜 고객.
const CUST = {
  kim: "11111111-1111-4111-8111-111111111111",
  lee: "22222222-2222-4222-8222-222222222222",
  park: "33333333-3333-4333-8333-333333333333",
};

// 리뷰 전용 가상 리뷰어 — PDP 리뷰 탭을 채우기 위한 합성 사용자 (FK 없음)
const REVIEWERS = {
  r1: "aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  r2: "bbbb2222-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  r3: "cccc3333-cccc-4ccc-8ccc-cccccccccccc",
  r4: "dddd4444-dddd-4ddd-8ddd-dddddddddddd",
  r5: "eeee5555-eeee-4eee-8eee-eeeeeeeeeeee",
  r6: "ffff6666-ffff-4fff-8fff-ffffffffffff",
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
    description: extra.description ?? null,
    images: [`/products/${slug}.png`],
    isPublished: true,
  };
}

const PRODUCTS = [
  product("nutrogin-focus", "NUTROGIN FOCUS 브레인케어 스틱", "NUTROGIN", "brain-focus", 39000, "데이터로 키운 진세노사이드 브레인케어, 하루 한 스틱.", {
    reportNo: "제2026-0000000001호",
    functionality: "인지능력 개선에 도움을 줄 수 있음(개별인정형)",
    intakeNotice: "임산부·수유부·어린이는 섭취에 주의. 이상사례 발생 시 섭취 중단.",
    ingredients: "홍삼농축액 70%(진세노사이드 Rg1+Rb1+Rg3), 비타민 B군",
    description: `NUTROGIN FOCUS는 6년근 홍삼 진세노사이드를 담은 프리미엄 브레인케어 스틱입니다.

6년근 홍삼에서 추출한 고순도 진세노사이드(Rg1+Rb1+Rg3) 복합 성분에 비타민 B군을 더했습니다. 나노에멀전 공법으로 유효 성분이 잘 흡수되도록 설계했습니다.

하루 한 스틱(10 mL)을 언제 어디서든 간편하게 섭취할 수 있으며, 쓴맛 없이 은은한 홍삼향과 부드러운 텍스처로 거부감 없이 즐길 수 있습니다.

【 이런 분께 추천합니다 】
· 업무·학습 중 집중하는 시간이 많은 분
· 오후 컨디션을 챙기고 싶은 직장인·학생
· 인지능력을 데일리 루틴으로 관리하고 싶은 분

1박스(10스틱)로 10일간 섭취하거나, 3박스 세트로 한 달 루틴을 시작해 보세요.`,
  }),
  product("nutrogin-clear", "NUTROGIN CLEAR 스틱", "NUTROGIN", "brain-focus", 39000, "맑은 하루를 위한 브레인케어.", {
    reportNo: "제2026-0000000002호",
    functionality: "피로 개선에 도움을 줄 수 있음",
    ingredients: "홍삼농축액, 아연",
    description: `NUTROGIN CLEAR는 맑은 하루를 위해 설계된 데이 타임 포뮬러입니다.

홍삼 핵심 성분과 아연을 함께 담았습니다. 카페인 없이 자연 유래 성분만으로 하루를 맑게 시작할 수 있습니다.

물에 타거나 그냥 즐길 수 있는 액상 스틱 형태로 출퇴근길, 점심 식후, 운동 전 어느 타이밍에나 간편하게 섭취 가능합니다.

【 제품 특장점 】
· 카페인 Zero — 오후에도 부담 없이
· 아연 100% 일일 영양성분 기준치 충족
· 비건 인증 원료 사용, 합성향료 무첨가`,
  }),
  product("nutrogin-rest", "NUTROGIN REST 스틱", "NUTROGIN", "sleep", 39000, "깊은 휴식을 위한 나이트 케어.", {
    reportNo: "제2026-0000000003호",
    functionality: "수면의 질 개선에 도움을 줄 수 있음",
    intakeNotice: "취침 전 섭취. 운전 전 섭취 주의.",
    ingredients: "테아닌, 락티움",
    description: `NUTROGIN REST는 취침 전 데일리 루틴을 위한 나이트 케어 포뮬러입니다.

녹차에서 추출한 L-테아닌(200 mg)이 편안한 이완에 도움을 줄 수 있고, 우유 단백질 가수분해물 락티움(Lactium®)을 함께 담았습니다.

취침 전 데일리 루틴으로 부담 없이 챙길 수 있도록 설계했습니다.

【 권장 섭취 방법 】
취침 30분 전, 물 한 컵과 함께 섭취하세요. 섭취 후 스마트폰 사용을 줄이고 조명을 낮추는 것을 권장합니다.`,
  }),
  product("wsb-immune-balance", "WSB 이뮨 밸런스", "WSB", "immune", 28000, "일상 면역 케어.", {
    reportNo: "제2026-0000000010호",
    functionality: "면역력 증진에 도움을 줄 수 있음",
    intakeNotice: "알레르기 체질은 원료 확인.",
    ingredients: "아연, 비타민C, 홍삼",
    description: `WSB 이뮨 밸런스는 아연·비타민C·홍삼을 함께 담은 일상 면역 케어 제품입니다.

아연(Zinc)은 정상적인 면역 기능에 필요한 미네랄이며, 비타민C는 항산화 작용에 도움을 줄 수 있습니다. 여기에 면역 기능 개선 기능성이 인정된 홍삼 성분을 더했습니다.

환절기, 피로가 쌓이는 시기, 컨디션 관리가 필요한 기간의 데일리 루틴으로 챙겨보세요.

【 함유 성분 요약 】
· 아연: 정상적인 면역 기능 유지에 필요
· 비타민C: 항산화, 콜라겐 형성 기여
· 홍삼: 면역 기능 개선(개별인정형)`,
  }),
  product("wsb-vita-day", "WSB 비타 데이", "WSB", "vitality", 22000, "하루 활력 멀티비타민.", {
    reportNo: "제2026-0000000011호",
    functionality: "피로 개선에 도움을 줄 수 있음",
    intakeNotice: "1일 1회 1포.",
    ingredients: "비타민 B·C·D, 미네랄",
    description: `WSB 비타 데이는 바쁜 일상에서 놓치기 쉬운 비타민과 미네랄을 한 포로 채울 수 있는 데일리 멀티비타민입니다.

비타민 B1·B2·B6·B12의 B군 복합체가 에너지 생성 대사에 도움을 줄 수 있고, 비타민 D3가 칼슘 흡수와 뼈 건강에 도움을 줄 수 있습니다. 비타민 C는 항산화에 도움을 줄 수 있습니다.

아침 식사와 함께 1포를 섭취하는 데일리 루틴으로 하루 영양소 섭취를 챙겨보세요.

【 이런 분께 추천합니다 】
· 식사가 불규칙한 직장인·학생
· 채식 식단으로 비타민 B12·D 섭취를 챙기고 싶은 분
· 활력을 데일리 루틴으로 관리하고 싶은 분`,
  }),
  product("wsb-propolis-guard", "WSB 프로폴리스 가드", "WSB", "immune", 32000, "환절기 목·면역 케어 프로폴리스.", {
    reportNo: "제2026-0000000012호",
    functionality: "항산화·구강 항균에 도움을 줄 수 있음",
    ingredients: "프로폴리스 추출물, 비타민C",
    description: `WSB 프로폴리스 가드는 프로폴리스와 비타민C를 함께 담아 구강 컨디션을 챙기는 제품입니다.

브라질산 그린 프로폴리스(플라보노이드 8% 이상 함유)를 고농축으로 담았습니다. 프로폴리스는 항산화·구강 항균에 도움을 줄 수 있습니다. 환절기에 목·구강 컨디션을 챙기고 싶은 분께 데일리 루틴으로 권해드립니다.

스프레이 타입이 아닌 섭취형 스틱으로 간편하게 즐길 수 있습니다.

【 주요 특징 】
· 브라질산 그린 프로폴리스 고함량
· 합성 감미료 무첨가, 자연 꿀 향
· 어린이~성인 전 연령 섭취 가능(1일 1포)`,
  }),
  product("wsb-omega3", "WSB 트리플 오메가3", "WSB", "vitality", 26000, "혈행·기억력 케어 rTG 오메가3.", {
    reportNo: "제2026-0000000013호",
    functionality: "혈중 중성지방 개선·혈행 개선에 도움을 줄 수 있음",
    ingredients: "정제어유(EPA·DHA), 비타민E",
    description: `WSB 트리플 오메가3는 rTG(재에스테르화 트리글리세리드) 타입 오메가3로, 유효 성분이 잘 흡수되도록 설계했습니다.

EPA(Eicosapentaenoic acid)와 DHA(Docosahexaenoic acid) 합계 1,000 mg을 1일 2캡슐에 담았습니다. 오메가3는 혈중 중성지방 개선·혈행 개선에 도움을 줄 수 있습니다. 비타민E를 함께 담았습니다.

남해 청정 해역에서 포획된 어류를 원료로 사용하며, 중금속(납·수은·카드뮴) 3중 정제 공정을 거쳤습니다.

【 권장 섭취법 】
식사와 함께 1일 2캡슐을 섭취하세요. 혈액 응고 억제제 복용 중이신 분은 의사와 상담 후 섭취를 권장합니다.`,
  }),
  product("wsb-sleep-therapy", "WSB 슬립 테라피", "WSB", "sleep", 30000, "편안한 밤을 위한 수면 케어.", {
    reportNo: "제2026-0000000014호",
    functionality: "수면의 질 개선에 도움을 줄 수 있음",
    intakeNotice: "취침 30분 전 섭취.",
    ingredients: "감태추출물, GABA, 테아닌",
    description: `WSB 슬립 테라피는 세 가지 수면 관련 원료(감태추출물·GABA·테아닌)를 배합한 수면 케어 포뮬러입니다.

감태추출물·GABA·L-테아닌을 함께 담아 수면의 질 개선에 도움을 줄 수 있습니다. 취침 전 데일리 루틴으로 부담 없이 챙길 수 있도록 설계했습니다.

【 섭취 안내 】
취침 30분 전 물과 함께 1포를 섭취하세요.

【 주의 】
운전 등 집중력이 필요한 작업 전에는 섭취를 피하세요. 임산부·수유부는 전문가와 상담 후 섭취하세요.`,
  }),
  product("wsb-probiotics", "WSB 프로바이오 데일리", "WSB", "immune", 24000, "장 건강 데일리 유산균 100억 CFU.", {
    reportNo: "제2026-0000000015호",
    functionality: "유산균 증식·유해균 억제·배변활동 원활에 도움을 줄 수 있음",
    ingredients: "프로바이오틱스 혼합 분말, 프리바이오틱스",
    description: `WSB 프로바이오 데일리는 19종 복합 유산균 100억 CFU와 프리바이오틱스(FOS)를 결합한 프리·프로바이오틱 제품입니다.

유산균 증식·유해균 억제·배변활동 원활에 도움을 줄 수 있습니다. 프리바이오틱스를 함께 담아 데일리 장 케어 루틴으로 챙길 수 있습니다.

위산·담즙산에 강한 마이크로캡슐 코팅 기술을 적용해 유산균이 장까지 잘 도달하도록 설계했습니다.

【 이런 분께 추천합니다 】
· 장 건강을 데일리 루틴으로 챙기고 싶은 분
· 식단·생활 리듬이 불규칙한 분
· 면역과 장 컨디션을 함께 관리하고 싶은 분

냉장 보관이 필요 없는 상온 안정형 제품입니다.`,
  }),
  product("wsb-lutein-eye", "WSB 루테인 아이케어", "WSB", "vitality", 27000, "눈 건강 루테인·지아잔틴.", {
    reportNo: "제2026-0000000016호",
    functionality: "노화로 인해 감소될 수 있는 황반색소밀도 유지에 도움을 줄 수 있음",
    ingredients: "마리골드추출물(루테인), 비타민A",
    description: `WSB 루테인 아이케어는 디지털 기기 사용이 많은 현대인을 위한 눈 건강 케어 제품입니다.

마리골드 꽃에서 추출한 루테인(20 mg)과 지아잔틴(4 mg)을 담았습니다. 루테인은 노화로 인해 감소될 수 있는 황반색소밀도 유지에 도움을 줄 수 있습니다. 비타민A는 어두운 곳에서 시각 적응에 도움을 줄 수 있습니다.

장시간 스마트폰·컴퓨터 모니터를 사용하거나 운전 시간이 긴 분들께 데일리 루틴으로 권해드립니다.

【 복용 안내 】
1일 1캡슐, 식사와 함께 물로 섭취하세요. 지용성 영양소이므로 지방이 포함된 식사 시 함께 섭취하면 흡수율이 높아집니다.

【 함유 성분 】
루테인 20 mg / 지아잔틴 4 mg / 비타민A 700 μg RE`,
  }),
];

type DemoItem = { slug: string; v: 0 | 1; qty: number };
type DemoOrder = {
  no: string; status: string; days: number; userId: string | null;
  name: string; phone: string; email: string; addr: string; zip: string;
  items: DemoItem[]; courier?: string; tracking?: string;
};

const CJ = "CJ대한통운";
const ORDERS: DemoOrder[] = [
  { no: "DEMO-0001", status: "delivered", days: 13, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-focus", v: 1, qty: 1 }], courier: CJ, tracking: "640012345001" },
  { no: "DEMO-0002", status: "delivered", days: 12, userId: CUST.kim, name: "김지후", phone: "010-2000-0002", email: "kim@example.com", addr: "경기도 성남시 분당구 판교로 22", zip: "13529", items: [{ slug: "wsb-immune-balance", v: 0, qty: 2 }], courier: CJ, tracking: "640012345002" },
  { no: "DEMO-0003", status: "shipped", days: 10, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-rest", v: 0, qty: 1 }, { slug: "wsb-vita-day", v: 0, qty: 1 }], courier: "한진택배", tracking: "508800012003" },
  { no: "DEMO-0004", status: "paid", days: 9, userId: CUST.lee, name: "이서연", phone: "010-3000-0003", email: "lee@example.com", addr: "부산광역시 해운대구 센텀로 33", zip: "48058", items: [{ slug: "wsb-vita-day", v: 0, qty: 1 }] },
  { no: "DEMO-0005", status: "preparing", days: 8, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-clear", v: 1, qty: 1 }] },
  { no: "DEMO-0006", status: "delivered", days: 7, userId: CUST.park, name: "박도윤", phone: "010-4000-0004", email: "park@example.com", addr: "대전광역시 유성구 대학로 99", zip: "34141", items: [{ slug: "wsb-omega3", v: 0, qty: 2 }], courier: CJ, tracking: "640012345006" },
  { no: "DEMO-0007", status: "shipped", days: 6, userId: CUST.kim, name: "김지후", phone: "010-2000-0002", email: "kim@example.com", addr: "경기도 성남시 분당구 판교로 22", zip: "13529", items: [{ slug: "nutrogin-focus", v: 0, qty: 1 }, { slug: "wsb-immune-balance", v: 0, qty: 1 }], courier: CJ, tracking: "640012345007" },
  { no: "DEMO-0008", status: "cancelled", days: 6, userId: null, name: "최비회원", phone: "010-5000-0005", email: "guest1@example.com", addr: "광주광역시 서구 상무대로 12", zip: "61945", items: [{ slug: "wsb-vita-day", v: 0, qty: 1 }] },
  { no: "DEMO-0009", status: "paid", days: 5, userId: null, name: "정게스트", phone: "010-6000-0006", email: "guest2@example.com", addr: "인천광역시 연수구 송도과학로 7", zip: "21984", items: [{ slug: "wsb-sleep-therapy", v: 0, qty: 1 }] },
  { no: "DEMO-0010", status: "delivered", days: 4, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "nutrogin-focus", v: 0, qty: 2 }], courier: CJ, tracking: "640012345010" },
  { no: "DEMO-0011", status: "preparing", days: 3, userId: CUST.lee, name: "이서연", phone: "010-3000-0003", email: "lee@example.com", addr: "부산광역시 해운대구 센텀로 33", zip: "48058", items: [{ slug: "wsb-probiotics", v: 0, qty: 1 }] },
  { no: "DEMO-0012", status: "paid", days: 2, userId: CUST.park, name: "박도윤", phone: "010-4000-0004", email: "park@example.com", addr: "대전광역시 유성구 대학로 99", zip: "34141", items: [{ slug: "nutrogin-clear", v: 0, qty: 1 }] },
  { no: "DEMO-0013", status: "pending", days: 1, userId: null, name: "한대기", phone: "010-7000-0007", email: "guest3@example.com", addr: "울산광역시 남구 삼산로 50", zip: "44705", items: [{ slug: "nutrogin-rest", v: 0, qty: 1 }] },
  { no: "DEMO-0014", status: "pending", days: 0, userId: null, name: "오신규", phone: "010-8000-0008", email: "guest4@example.com", addr: "서울특별시 마포구 양화로 45", zip: "04039", items: [{ slug: "wsb-vita-day", v: 0, qty: 2 }] },
  { no: "DEMO-0015", status: "delivered", days: 0, userId: CUST.kim, name: "김지후", phone: "010-2000-0002", email: "kim@example.com", addr: "경기도 성남시 분당구 판교로 22", zip: "13529", items: [{ slug: "wsb-lutein-eye", v: 0, qty: 1 }, { slug: "wsb-vita-day", v: 0, qty: 1 }], courier: CJ, tracking: "640012345015" },
  // DEMO_USER_ID 전용 — paid / preparing / shipped / delivered 4가지 상태 보장
  { no: "DEMO-0016", status: "paid", days: 2, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "wsb-probiotics", v: 0, qty: 1 }] },
  { no: "DEMO-0017", status: "preparing", days: 1, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "wsb-omega3", v: 0, qty: 1 }] },
  { no: "DEMO-0018", status: "delivered", days: 20, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "wsb-immune-balance", v: 0, qty: 1 }, { slug: "wsb-propolis-guard", v: 0, qty: 1 }], courier: CJ, tracking: "640012345018" },
  { no: "DEMO-0019", status: "delivered", days: 18, userId: DEMO_USER_ID, name: "관리자", phone: "010-1000-0001", email: "admin@glitzy.kr", addr: "서울특별시 강남구 테헤란로 1", zip: "06133", items: [{ slug: "wsb-lutein-eye", v: 0, qty: 1 }], courier: CJ, tracking: "640012345019" },
];

// REV 주문 — 리뷰어별 가상 배송완료 주문 (각 리뷰어가 여러 상품 포함)
// 이 주문들은 PDP 리뷰를 채우기 위한 합성 데이터
const REV_ORDERS: DemoOrder[] = [
  {
    no: "REV-0001", status: "delivered", days: 30, userId: REVIEWERS.r1,
    name: "리뷰어1", phone: "010-9001-0001", email: "rev1@example.com",
    addr: "서울특별시 서초구 강남대로 100", zip: "06545",
    items: [
      { slug: "nutrogin-focus", v: 0, qty: 1 },
      { slug: "nutrogin-clear", v: 0, qty: 1 },
      { slug: "wsb-omega3", v: 0, qty: 1 },
    ],
    courier: CJ, tracking: "rev0001track01",
  },
  {
    no: "REV-0002", status: "delivered", days: 28, userId: REVIEWERS.r2,
    name: "리뷰어2", phone: "010-9002-0002", email: "rev2@example.com",
    addr: "경기도 수원시 영통구 월드컵로 200", zip: "16690",
    items: [
      { slug: "nutrogin-rest", v: 0, qty: 1 },
      { slug: "wsb-sleep-therapy", v: 0, qty: 1 },
      { slug: "wsb-vita-day", v: 0, qty: 1 },
    ],
    courier: CJ, tracking: "rev0002track02",
  },
  {
    no: "REV-0003", status: "delivered", days: 25, userId: REVIEWERS.r3,
    name: "리뷰어3", phone: "010-9003-0003", email: "rev3@example.com",
    addr: "부산광역시 사하구 낙동대로 300", zip: "49311",
    items: [
      { slug: "wsb-immune-balance", v: 0, qty: 1 },
      { slug: "wsb-propolis-guard", v: 0, qty: 1 },
      { slug: "wsb-probiotics", v: 0, qty: 1 },
    ],
    courier: CJ, tracking: "rev0003track03",
  },
  {
    no: "REV-0004", status: "delivered", days: 22, userId: REVIEWERS.r4,
    name: "리뷰어4", phone: "010-9004-0004", email: "rev4@example.com",
    addr: "인천광역시 남동구 소래로 400", zip: "21565",
    items: [
      { slug: "wsb-lutein-eye", v: 0, qty: 1 },
      { slug: "wsb-omega3", v: 0, qty: 1 },
      { slug: "nutrogin-focus", v: 0, qty: 1 },
    ],
    courier: CJ, tracking: "rev0004track04",
  },
  {
    no: "REV-0005", status: "delivered", days: 19, userId: REVIEWERS.r5,
    name: "리뷰어5", phone: "010-9005-0005", email: "rev5@example.com",
    addr: "대구광역시 달서구 달구벌대로 500", zip: "42709",
    items: [
      { slug: "nutrogin-clear", v: 0, qty: 1 },
      { slug: "wsb-sleep-therapy", v: 0, qty: 1 },
      { slug: "wsb-immune-balance", v: 0, qty: 1 },
    ],
    courier: CJ, tracking: "rev0005track05",
  },
  {
    no: "REV-0006", status: "delivered", days: 16, userId: REVIEWERS.r6,
    name: "리뷰어6", phone: "010-9006-0006", email: "rev6@example.com",
    addr: "광주광역시 북구 첨단과기로 600", zip: "61009",
    items: [
      { slug: "wsb-probiotics", v: 0, qty: 1 },
      { slug: "wsb-vita-day", v: 0, qty: 1 },
      { slug: "wsb-propolis-guard", v: 0, qty: 1 },
      { slug: "nutrogin-rest", v: 0, qty: 1 },
    ],
    courier: CJ, tracking: "rev0006track06",
  },
];

async function main() {
  const db = getDb();

  // 1) 카테고리
  await db.insert(schema.categories).values(CATEGORIES).onConflictDoNothing({ target: schema.categories.slug });
  const cats = await db.select().from(schema.categories);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  // 2) 상품 — slug 기준 UPSERT (재시드 시 콘텐츠 필드 갱신)
  await db
    .insert(schema.products)
    .values(PRODUCTS.map(({ catSlug, ...p }) => ({ ...p, categoryId: catId(catSlug) })))
    .onConflictDoUpdate({
      target: schema.products.slug,
      set: {
        name: sql`excluded.name`,
        basePrice: sql`excluded.base_price`,
        summary: sql`excluded.summary`,
        description: sql`excluded.description`,
        reviewPhraseNo: sql`excluded.review_phrase_no`,
        noticeText: sql`excluded.notice_text`,
        reportNo: sql`excluded.report_no`,
        functionality: sql`excluded.functionality`,
        intakeNotice: sql`excluded.intake_notice`,
        ingredients: sql`excluded.ingredients`,
        images: sql`excluded.images`,
        isPublished: sql`excluded.is_published`,
        categoryId: sql`excluded.category_id`,
        updatedAt: new Date(),
      },
    });

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

  // 5) 데모 주문 — DEMO-% 및 REV-% 네임스페이스 멱등 재생성 (order_items·payments는 cascade 삭제)
  await db.delete(schema.orders).where(
    or(
      like(schema.orders.orderNumber, "DEMO-%"),
      like(schema.orders.orderNumber, "REV-%"),
    ),
  );

  const variants = await db.select().from(schema.productVariants);
  const bySlug = (slug: string) => products.find((p) => p.slug === slug)!;
  const variantsOf = (pid: string) => variants.filter((v) => v.productId === pid).sort((a, b) => a.sortOrder - b.sortOrder);

  // 헬퍼: 주문 배열 삽입
  async function insertOrders(orderList: DemoOrder[]) {
    const inserted: Array<{ no: string; id: string }> = [];
    for (const o of orderList) {
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
      inserted.push({ no: o.no, id: order.id });
    }
    return inserted;
  }

  const demoInserted = await insertOrders(ORDERS);
  const revInserted = await insertOrders(REV_ORDERS);

  const allInserted = [...demoInserted, ...revInserted];
  const orderIdByNo = (no: string) => allInserted.find((o) => o.no === no)?.id;

  // 6) 데모 쿠폰 (멱등 — code 기준 onConflictDoNothing)
  const DEMO_COUPONS = [
    {
      code: "WELCOME3000",
      name: "첫 구매 3,000원 할인",
      discountType: "fixed",
      discountValue: 3000,
      minSubtotal: 0,
      maxDiscount: null as number | null,
      isActive: true,
    },
    {
      code: "NUTRO10",
      name: "NUTROGIN 10% 할인 (최대 5,000원)",
      discountType: "percent",
      discountValue: 10,
      minSubtotal: 30000,
      maxDiscount: 5000 as number | null,
      isActive: true,
    },
  ];
  await db.insert(schema.coupons).values(DEMO_COUPONS).onConflictDoNothing({ target: schema.coupons.code });

  // DEMO_USER_ID에게 두 쿠폰 모두 등록 (마이페이지 테스트용)
  const welcome3000Rows = await db
    .select({ id: schema.coupons.id })
    .from(schema.coupons)
    .where(eq(schema.coupons.code, "WELCOME3000"));
  if (welcome3000Rows.length > 0) {
    await db
      .insert(schema.userCoupons)
      .values({ couponId: welcome3000Rows[0].id, userId: DEMO_USER_ID })
      .onConflictDoNothing();
  }

  const nutro10Rows = await db
    .select({ id: schema.coupons.id })
    .from(schema.coupons)
    .where(eq(schema.coupons.code, "NUTRO10"));
  if (nutro10Rows.length > 0) {
    await db
      .insert(schema.userCoupons)
      .values({ couponId: nutro10Rows[0].id, userId: DEMO_USER_ID })
      .onConflictDoNothing();
  }

  // NUTRO10 쿠폰을 사용 완료 상태로 표시 — 쿠폰함 "사용완료" 탭 데모용
  // DEMO-0001(delivered) 주문 ID를 연결
  if (nutro10Rows.length > 0) {
    const order0001Id = orderIdByNo("DEMO-0001");
    if (order0001Id) {
      // usedAt이 없는 NUTRO10 user_coupon만 갱신 (멱등)
      const uc = await db
        .select()
        .from(schema.userCoupons)
        .where(eq(schema.userCoupons.couponId, nutro10Rows[0].id))
        .limit(1);
      if (uc.length > 0 && !uc[0].usedAt) {
        await db
          .update(schema.userCoupons)
          .set({ usedAt: daysAgo(13), orderId: order0001Id })
          .where(eq(schema.userCoupons.id, uc[0].id));
      }
    }
  }

  // 7) 데모 배송지 (DEMO_USER_ID) — addresses에 자연 유니크 키 없음.
  //    userId 기준으로 이미 존재하는 경우 skip해 멱등성 보장.
  const existingAddresses = await db
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(eq(schema.addresses.userId, DEMO_USER_ID));
  if (existingAddresses.length === 0) {
    await db.insert(schema.addresses).values([
      {
        userId: DEMO_USER_ID,
        label: "집",
        recipient: "관리자",
        phone: "010-1000-0001",
        zipcode: "06133",
        address1: "서울특별시 강남구 테헤란로 1",
        address2: "WSB타워 5층",
        isDefault: true,
      },
      {
        userId: DEMO_USER_ID,
        label: "회사",
        recipient: "관리자",
        phone: "010-1000-0001",
        zipcode: "03181",
        address1: "서울특별시 종로구 청계천로 14",
        address2: "3층 사무실",
        isDefault: false,
      },
    ]);
  }

  // 8) 위시리스트 — DEMO_USER_ID 3~4 상품
  const wishlistSlugs = ["nutrogin-focus", "wsb-immune-balance", "wsb-omega3", "wsb-lutein-eye"];
  for (const slug of wishlistSlugs) {
    const prod = products.find((p) => p.slug === slug);
    if (prod) {
      await db
        .insert(schema.wishlists)
        .values({ userId: DEMO_USER_ID, productId: prod.id })
        .onConflictDoNothing();
    }
  }

  // 9) 데모 리뷰 — DEMO_USER_ID의 delivered 주문에 연결.
  //    unique(orderId, productId) 기준 onConflictDoNothing.
  const focusProduct = products.find((p) => p.slug === "nutrogin-focus");
  const restProduct = products.find((p) => p.slug === "nutrogin-rest");
  const immuneProduct = products.find((p) => p.slug === "wsb-immune-balance");
  const propProduct = products.find((p) => p.slug === "wsb-propolis-guard");
  const luteinProduct = products.find((p) => p.slug === "wsb-lutein-eye");

  const order0001Id = orderIdByNo("DEMO-0001");
  const order0003Id = orderIdByNo("DEMO-0003");
  const order0018Id = orderIdByNo("DEMO-0018");
  const order0019Id = orderIdByNo("DEMO-0019");

  // DEMO-0001: nutrogin-focus 리뷰 (이미지 포함)
  if (order0001Id && focusProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: focusProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0001Id,
        rating: 5,
        title: "맛도 좋고 휴대가 편해요",
        body: "한 달째 매일 아침 루틴으로 챙겨 먹고 있습니다. 스틱 하나씩 가방에 넣고 다니기 편하고, 쓴맛 없이 은은한 홍삼향에 텍스처가 부드러워서 부담 없이 마십니다. 맛이 좋아서 꾸준히 먹게 되네요. 재구매 예정입니다.",
        images: ["https://images.unsplash.com/photo-1550831107-1553da8c8464?w=600&q=80"],
      })
      .onConflictDoNothing();
  }

  // DEMO-0003: nutrogin-rest 리뷰
  if (order0003Id && restProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: restProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0003Id,
        rating: 4,
        title: "취침 전 루틴으로 챙기기 좋아요",
        body: "취침 30분 전에 물 한 컵과 함께 챙겨 먹는 루틴으로 자리잡았습니다. 액상 스틱이라 마시기 편하고 향도 부담 없어요. 아직 한 박스 다 먹지는 않았지만 매일 밤 챙기는 습관이 들어 만족스럽습니다.",
        images: [],
      })
      .onConflictDoNothing();
  }

  // DEMO-0018: wsb-immune-balance 리뷰
  if (order0018Id && immuneProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: immuneProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0018Id,
        rating: 4,
        title: "환절기마다 챙기는 데일리템",
        body: "환절기 컨디션 관리용으로 3개월째 매일 챙겨 먹고 있습니다. 아연과 비타민C에 홍삼까지 들어 있어 구성이 알차고, 한 포씩 포장돼 있어 섭취도 간편해요. 가격 대비 만족스러워서 꾸준히 먹고 있습니다.",
        images: [],
      })
      .onConflictDoNothing();
  }

  // DEMO-0018: wsb-propolis-guard 리뷰 (같은 주문)
  if (order0018Id && propProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: propProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0018Id,
        rating: 3,
        title: "향이 강한 편이라 호불호 있어요",
        body: "프로폴리스 특유의 향이 강해서 처음엔 적응이 필요했어요. 그래도 환절기 목 컨디션 챙길 때 데일리로 먹기 좋아서 계속 챙기고 있습니다. 향에 민감하신 분은 참고하세요.",
        images: [],
      })
      .onConflictDoNothing();
  }

  // DEMO-0019: wsb-lutein-eye 리뷰
  if (order0019Id && luteinProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: luteinProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0019Id,
        rating: 5,
        title: "캡슐이 작아 삼키기 편해요",
        body: "하루 10시간 이상 모니터를 보는 직업이라 눈 건강 데일리 케어용으로 시작했습니다. 루테인 함량 구성이 마음에 들고, 캡슐이 작아서 삼키기도 편해요. 아침 식사 후 챙겨 먹는 루틴으로 자리잡아 꾸준히 먹을 계획입니다.",
        images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
      })
      .onConflictDoNothing();
  }

  // 9b) 리뷰어 합성 리뷰 — REV 주문에 연결, onConflictDoNothing으로 멱등
  // 헬퍼: 리뷰 삽입
  async function insertReview(opts: {
    ordNo: string; slug: string; userId: string;
    rating: number; title: string; body: string; images?: string[];
  }) {
    const ordId = orderIdByNo(opts.ordNo);
    const prod = products.find((p) => p.slug === opts.slug);
    if (!ordId || !prod) return;
    await db.insert(schema.reviews).values({
      productId: prod.id,
      userId: opts.userId,
      orderId: ordId,
      rating: opts.rating,
      title: opts.title,
      body: opts.body,
      images: opts.images ?? [],
    }).onConflictDoNothing();
  }

  // REV-0001 (r1): nutrogin-focus, nutrogin-clear, wsb-omega3
  await insertReview({
    ordNo: "REV-0001", slug: "nutrogin-focus", userId: REVIEWERS.r1,
    rating: 5,
    title: "쓴맛 없이 매일 챙기기 좋아요",
    body: "홍삼 특유의 쓴맛이 없어서 매일 아침 부담 없이 챙겨 먹습니다. 은은한 홍삼향에 텍스처가 부드러워 물 없이 그냥 마셔도 좋아요. 스틱 포장이라 휴대도 편하고요. 오후에 한 스틱 챙기는 루틴이 자리잡아 3박스 세트로 주문해 꾸준히 먹을 예정입니다.",
    images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80"],
  });
  await insertReview({
    ordNo: "REV-0001", slug: "nutrogin-clear", userId: REVIEWERS.r1,
    rating: 4,
    title: "카페인 없는 데이타임 스틱이 좋아요",
    body: "카페인을 줄이고 싶어서 점심 식후 루틴으로 CLEAR 스틱을 챙기고 있습니다. 액상이라 마시기 편하고 향도 깔끔해요. 카페인 없이 부담 없는 데이타임 음용이 마음에 듭니다. 아연 100% 기준치 구성이라 데일리로 챙기기 좋아 만족합니다.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0001", slug: "wsb-omega3", userId: REVIEWERS.r1,
    rating: 5,
    title: "비린내가 거의 없어 먹기 편해요",
    body: "오메가3를 몇 년째 먹어왔는데 이번에 rTG 타입으로 바꿨습니다. 물고기 비린내가 거의 없어서 아침에 먹어도 역류감이 없어 좋아요. 캡슐 크기도 적당해 삼키기 편하고, 비타민E까지 들어있어 데일리로 챙기기 좋습니다.",
    images: [],
  });

  // REV-0002 (r2): nutrogin-rest, wsb-sleep-therapy, wsb-vita-day
  await insertReview({
    ordNo: "REV-0002", slug: "nutrogin-rest", userId: REVIEWERS.r2,
    rating: 5,
    title: "취침 전 루틴으로 딱 좋아요",
    body: "여러 나이트 케어 제품을 써봤는데 이게 향이나 텍스처 면에서 제일 편합니다. 취침 30분 전 한 스틱 챙기는 루틴이 자연스럽게 자리잡았어요. 액상이라 물 없이 마시기도 좋고, 단맛도 과하지 않아 매일 부담 없이 즐기고 있습니다.",
    images: ["https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80"],
  });
  await insertReview({
    ordNo: "REV-0002", slug: "wsb-sleep-therapy", userId: REVIEWERS.r2,
    rating: 4,
    title: "취침 전 루틴화하기 좋은 포뮬러",
    body: "취침 30분 전 물 한 컵과 함께 챙기는 루틴으로 자리잡았습니다. 한 포씩 포장돼 있어 섭취가 간편하고, 향도 부담 없어 매일 꾸준히 챙기기 좋아요. 잠자리 정리하면서 한 포 챙기는 습관이 들어 만족합니다.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0002", slug: "wsb-vita-day", userId: REVIEWERS.r2,
    rating: 4,
    title: "한 포로 간편하게 챙기는 멀티비타민",
    body: "비건 식단을 하다 보니 B12 섭취를 챙기고 싶었는데, 비타 데이 한 포로 B군을 간편하게 채울 수 있어 좋습니다. 1일 1포라 관리가 편하고, 한 포씩 포장돼 있어 가방에 넣고 다니기도 좋아요. 가격 대비 성분 구성이 알차서 만족합니다.",
    images: [],
  });

  // REV-0003 (r3): wsb-immune-balance, wsb-propolis-guard, wsb-probiotics
  await insertReview({
    ordNo: "REV-0003", slug: "wsb-immune-balance", userId: REVIEWERS.r3,
    rating: 5,
    title: "구성이 알차서 데일리로 챙겨요",
    body: "아연·비타민C·홍삼 조합이라 면역 케어 데일리템으로 챙기기 좋습니다. 한 포씩 포장돼 있어 섭취가 간편하고 맛도 부담 없어요. 바쁜 시기 컨디션 관리용으로 매일 챙기는 루틴이 자리잡아서 정기 구매로 전환했습니다.",
    images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&q=80"],
  });
  await insertReview({
    ordNo: "REV-0003", slug: "wsb-propolis-guard", userId: REVIEWERS.r3,
    rating: 4,
    title: "꿀 향이 은은해서 먹기 좋아요",
    body: "환절기에 목 컨디션 챙기고 싶을 때마다 데일리로 챙겨 먹고 있습니다. 브라질산 그린 프로폴리스라 원료도 믿음이 가고, 은은한 꿀 향이 나서 먹기 편해요. 프로폴리스 특유의 향이 조금 있지만 익숙해지면 괜찮습니다.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0003", slug: "wsb-probiotics", userId: REVIEWERS.r3,
    rating: 5,
    title: "상온 보관에 섭취가 간편해요",
    body: "19종 유산균 100억 CFU 구성이 마음에 들어 장 건강 데일리 케어용으로 시작했습니다. 냉장 보관 없이 상온에 둘 수 있어 보관이 편하고, 한 포씩 포장돼 있어 섭취도 간편해요. 매일 아침 챙기는 루틴으로 자리잡아 꾸준히 먹고 있습니다.",
    images: [],
  });

  // REV-0004 (r4): wsb-lutein-eye, wsb-omega3, nutrogin-focus
  await insertReview({
    ordNo: "REV-0004", slug: "wsb-lutein-eye", userId: REVIEWERS.r4,
    title: "모니터 많이 보는 분께 데일리로 추천",
    rating: 5,
    body: "재택근무로 하루 13시간 이상 모니터 앞에 있어서 눈 건강 데일리 케어용으로 시작했습니다. 루테인 20mg + 지아잔틴 4mg 구성이 마음에 들어요. 지용성이라 식사와 함께 먹으면 흡수가 잘 된다고 해서 아침밥 후에 챙겨 먹는 루틴으로 자리잡았습니다.",
    images: ["https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=600&q=80"],
  });
  await insertReview({
    ordNo: "REV-0004", slug: "wsb-omega3", userId: REVIEWERS.r4,
    rating: 4,
    title: "캡슐 크기가 적당하고 비린내 없어요",
    body: "건강 관리 차원에서 오메가3를 데일리로 챙기기 시작했습니다. rTG 타입이라 그런지 비린내가 거의 없어서 좋아요. 캡슐 크기도 적당해 삼키기 편하고, 식사와 함께 두 캡슐 챙기는 루틴이라 부담이 없습니다. 꾸준히 먹을 예정입니다.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0004", slug: "nutrogin-focus", userId: REVIEWERS.r4,
    rating: 4,
    title: "맛이 좋아 아침 루틴으로 자리잡았어요",
    body: "40대 이후 인지능력을 데일리 루틴으로 관리하고 싶어서 시작했습니다. 홍삼향이 은은하고 텍스처가 부드러워 맛이 좋아요. 스틱 포장이라 휴대도 편하고요. 매일 아침 한 스틱 챙기는 루틴으로 자리잡아 꾸준히 먹고 있습니다.",
    images: [],
  });

  // REV-0005 (r5): nutrogin-clear, wsb-sleep-therapy, wsb-immune-balance
  await insertReview({
    ordNo: "REV-0005", slug: "nutrogin-clear", userId: REVIEWERS.r5,
    rating: 3,
    title: "맛은 깔끔한데 가격이 좀 아쉬워요",
    body: "홍삼+아연 조합에 카페인이 없어서 데이타임 음용으로 부담 없이 챙기기 좋습니다. 맛도 깔끔하고요. 다만 박스당 가격을 생각하면 비용이 조금 아쉽습니다. 구성은 좋은데 좀 더 가성비 있는 용량이 나오면 좋겠습니다. 재구매는 할인 행사 때 할 것 같아요.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0005", slug: "wsb-sleep-therapy", userId: REVIEWERS.r5,
    rating: 5,
    title: "취침 전 루틴으로 완전히 자리잡았어요",
    body: "감태·GABA·테아닌 구성이라 취침 전 데일리 루틴으로 챙기기 좋습니다. 한 포씩 포장돼 있어 섭취가 간편하고, 향도 부담 없어 매일 챙기게 돼요. 잠자리 정리하면서 한 포 챙기는 습관이 들어 2박스째 구매 중이고 앞으로도 계속 쓸 것 같습니다.",
    images: ["https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=600&q=80"],
  });
  await insertReview({
    ordNo: "REV-0005", slug: "wsb-immune-balance", userId: REVIEWERS.r5,
    rating: 4,
    title: "아연·비타민C 구성이 알찬 면역 데일리템",
    body: "아연 기준치 100%에 비타민C까지 들어있어서 면역 케어 데일리템으로 챙기기 좋습니다. 홍삼 성분까지 더해져 구성이 알차요. 환절기 컨디션 관리용으로 매일 챙기는 루틴이 자리잡아 꾸준히 먹고 있습니다.",
    images: [],
  });

  // REV-0006 (r6): wsb-probiotics, wsb-vita-day, wsb-propolis-guard, nutrogin-rest
  await insertReview({
    ordNo: "REV-0006", slug: "wsb-probiotics", userId: REVIEWERS.r6,
    rating: 4,
    title: "상온 보관 가능해 챙기기 편한 유산균",
    body: "19종 복합 유산균 구성이라 장 건강 데일리 케어용으로 챙기고 있습니다. 한 포씩 포장돼 있어 섭취가 간편하고, 냉장 보관 없이 상온에서 둘 수 있어 편리해요. 매일 아침 챙기는 루틴으로 자리잡아 꾸준히 먹고 있습니다.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0006", slug: "wsb-vita-day", userId: REVIEWERS.r6,
    rating: 5,
    title: "아침 루틴의 필수품이 되었어요",
    body: "B군 복합체에 비타민D까지 포함되어 있어서 실내 생활이 많은 저한테 딱 맞는 구성이에요. 불규칙한 식단을 보완하는 데일리 멀티비타민으로 챙기기 좋습니다. 한 포씩 포장되어 있어서 가방에 넣고 다니기도 편하고, 매일 아침 챙기는 루틴으로 자리잡았습니다.",
    images: ["https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80"],
  });
  await insertReview({
    ordNo: "REV-0006", slug: "wsb-propolis-guard", userId: REVIEWERS.r6,
    rating: 4,
    title: "꿀 향이 은은해 온 가족이 함께 먹어요",
    body: "구강 컨디션을 데일리로 챙기고 싶어서 프로폴리스 가드를 먹고 있습니다. 브라질 그린 프로폴리스 플라보노이드 8% 이상이라는 구성이 마음에 들어요. 꿀 향이 은은해서 먹기도 좋고, 1일 1포라 관리가 편합니다. 온 가족이 함께 챙겨 먹기 좋습니다.",
    images: [],
  });
  await insertReview({
    ordNo: "REV-0006", slug: "nutrogin-rest", userId: REVIEWERS.r6,
    rating: 5,
    title: "취침 전 데일리 루틴으로 자리잡았어요",
    body: "취침 전 데일리 루틴으로 챙기는 나이트 케어입니다. L-테아닌 200mg에 락티움(Lactium®) 성분 구성이 마음에 들어요. 액상 스틱이라 물 없이 마시기 편하고 향도 부담 없습니다. 6주째 매일 밤 챙기는 습관이 들어 꾸준히 먹고 있습니다.",
    images: [],
  });

  // 10) 문의 — DEMO_USER_ID, 자연 유니크 키 없으므로 count 확인으로 멱등
  const existingInquiries = await db
    .select({ id: schema.inquiries.id })
    .from(schema.inquiries)
    .where(eq(schema.inquiries.userId, DEMO_USER_ID));

  if (existingInquiries.length === 0) {
    await db.insert(schema.inquiries).values([
      {
        userId: DEMO_USER_ID,
        email: "admin@glitzy.kr",
        category: "product",
        subject: "NUTROGIN FOCUS 임산부 섭취 가능 여부 문의",
        body: "안녕하세요. NUTROGIN FOCUS 브레인케어 스틱 구매를 고려 중인데, 임신 중에도 섭취 가능한가요? 홍삼 성분이 포함되어 있어 문의드립니다.",
        status: "open",
      },
      {
        userId: DEMO_USER_ID,
        email: "admin@glitzy.kr",
        category: "order",
        subject: "DEMO-0001 주문 배송 포장 문의",
        body: "선물용으로 구매했는데 선물 포장 서비스가 가능한지 알고 싶습니다.",
        status: "answered",
        answer: "안녕하세요, WSB 고객센터입니다. 현재 온라인 주문에서 별도 선물 포장 서비스는 제공하지 않습니다. 다만, 리본·메시지 카드 동봉 서비스를 준비 중이며 2026년 3분기 내 오픈 예정입니다. 이용에 불편을 드려 죄송합니다.",
      },
    ]);
  }

  // 11) 주문 취소/반품 신청 — DEMO_USER_ID의 delivered 주문에 연결
  //     orderCancellations에 자연 유니크 키 없으므로 userId+orderId 기준 count 확인으로 멱등
  const targetOrderId = orderIdByNo("DEMO-0018");
  if (targetOrderId) {
    const existingCancellations = await db
      .select({ id: schema.orderCancellations.id })
      .from(schema.orderCancellations)
      .where(eq(schema.orderCancellations.orderId, targetOrderId));

    if (existingCancellations.length === 0) {
      await db.insert(schema.orderCancellations).values({
        orderId: targetOrderId,
        userId: DEMO_USER_ID,
        type: "return",
        reason: "상품이 기대와 달리 제 체질에 맞지 않아 반품 신청합니다. 미개봉 상태로 보관 중입니다.",
        status: "requested",
        createdAt: daysAgo(18),
      });
    }
  }

  console.log(`seed 완료: categories=${cats.length}, products=${products.length}, banners=${BANNERS.length}, orders=${ORDERS.length + REV_ORDERS.length} (DEMO=${ORDERS.length}, REV=${REV_ORDERS.length}), coupons=${DEMO_COUPONS.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
