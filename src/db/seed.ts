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
// DEMO_USER_ID: 환경변수로 재정의 가능. 기본값은 ADMIN_USER_ID.
const DEMO_USER_ID = process.env.SEED_DEMO_USER_ID ?? ADMIN_USER_ID;
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
    description: extra.description ?? null,
    images: [`/products/${slug}.png`],
    isPublished: true,
  };
}

const PRODUCTS = [
  product("nutrogin-focus", "NUTROGIN FOCUS 브레인케어 스틱", "NUTROGIN", "brain-focus", 39000, "데이터로 키운 진세노사이드 브레인케어, 하루 한 스틱.", {
    reportNo: "제2026-0000000001호",
    functionality: "인지능력 개선에 도움을 줄 수 있음(개별인정형 예시)",
    intakeNotice: "임산부·수유부·어린이는 섭취에 주의. 이상사례 발생 시 섭취 중단.",
    ingredients: "홍삼농축액 70%(진세노사이드 Rg1+Rb1+Rg3), 비타민 B군",
    description: `NUTROGIN FOCUS는 과학적 근거를 바탕으로 개발된 프리미엄 브레인케어 스틱입니다.

6년근 홍삼에서 추출한 고순도 진세노사이드(Rg1+Rb1+Rg3) 복합 성분이 두뇌 혈류를 원활하게 하고, 비타민 B군이 신경계 에너지 대사를 지원합니다. 특허 받은 나노에멀전 공법으로 유효 성분의 흡수율을 기존 대비 3.2배 높였습니다.

하루 한 스틱(10 mL)을 언제 어디서든 간편하게 섭취할 수 있으며, 쓴맛 없이 은은한 홍삼향과 부드러운 텍스처로 거부감 없이 즐길 수 있습니다.

【 이런 분께 추천합니다 】
· 업무·학습 중 집중력이 떨어진다고 느끼시는 분
· 오후 슬럼프가 자주 찾아오는 직장인·학생
· 기억력과 인지능력을 체계적으로 관리하고 싶은 분

1박스(10스틱)로 10일간 복용하거나, 3박스 세트로 1개월 집중 케어를 시작해 보세요.`,
  }),
  product("nutrogin-clear", "NUTROGIN CLEAR 스틱", "NUTROGIN", "brain-focus", 39000, "맑은 하루를 위한 브레인케어.", {
    reportNo: "제2026-0000000002호",
    functionality: "피로 개선에 도움을 줄 수 있음",
    ingredients: "홍삼농축액, 아연",
    description: `NUTROGIN CLEAR는 누적된 피로와 흐릿한 정신을 한 번에 해소하기 위해 설계된 데이 타임 포뮬러입니다.

홍삼 핵심 성분과 아연의 조합이 신체 피로 회복과 면역 기능을 동시에 지원합니다. 카페인 없이 자연 유래 성분만으로 하루를 맑게 시작할 수 있습니다.

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
    description: `NUTROGIN REST는 수면 전문 포뮬러로, 취침 30분 전 한 스틱으로 깊고 편안한 밤을 지원합니다.

녹차에서 추출한 L-테아닌(200 mg)이 뇌파를 알파파 상태로 유도해 자연스러운 이완을 돕고, 우유 단백질 가수분해물 락티움(Lactium®)이 스트레스 호르몬을 조절해 수면 진입 시간을 단축합니다.

수면제가 아닌 건강기능식품으로 의존성이 없으며, 다음 날 아침 두중함(sleep inertia)을 최소화하도록 설계되었습니다.

【 권장 섭취 방법 】
취침 30분 전, 물 한 컵과 함께 섭취하세요. 효과를 최대화하려면 섭취 후 스마트폰 사용을 줄이고 조명을 낮추는 것을 권장합니다.`,
  }),
  product("wsb-immune-balance", "WSB 이뮨 밸런스", "WSB", "immune", 28000, "일상 면역 케어.", {
    reportNo: "제2026-0000000010호",
    functionality: "면역력 증진에 도움을 줄 수 있음",
    intakeNotice: "알레르기 체질은 원료 확인.",
    ingredients: "아연, 비타민C, 홍삼",
    description: `WSB 이뮨 밸런스는 면역 시스템의 3가지 핵심 축을 동시에 강화하는 일상 면역 케어 제품입니다.

아연(Zinc)은 면역 세포의 생성·분화에 필수적인 미네랄로, 비타민C와 시너지를 이루어 항산화 방어막을 강화합니다. 여기에 면역조절 기능이 인정된 홍삼 성분을 더해 삼중 면역 케어를 완성했습니다.

환절기, 피로 누적 시기, 스트레스가 많은 기간에 특히 효과적입니다.

【 함유 성분 및 효능 요약 】
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

비타민 B1·B2·B6·B12의 B군 복합체가 에너지 생성 대사를 활성화하고, 비타민 D3가 칼슘 흡수와 뼈 건강을 지원합니다. 비타민 C는 면역 방어와 항산화 기능으로 활성산소를 제거합니다.

아침 식사와 함께 1포를 복용하는 것만으로 하루 필요 영양소의 기준치를 충족할 수 있습니다.

【 이런 분께 추천합니다 】
· 식사가 불규칙한 직장인·학생
· 채식 식단으로 비타민 B12·D가 부족할 수 있는 분
· 피곤함이 잦고 활력이 떨어진다고 느끼는 분`,
  }),
  product("wsb-propolis-guard", "WSB 프로폴리스 가드", "WSB", "immune", 32000, "환절기 목·면역 케어 프로폴리스.", {
    reportNo: "제2026-0000000012호",
    functionality: "항산화·구강 항균에 도움을 줄 수 있음",
    ingredients: "프로폴리스 추출물, 비타민C",
    description: `WSB 프로폴리스 가드는 천연 항균 성분인 프로폴리스와 비타민C의 조합으로 구강과 인후 건강을 집중 케어합니다.

브라질산 그린 프로폴리스(플라보노이드 8% 이상 함유)를 고농축 추출해 항산화·항균 효능을 극대화했습니다. 환절기 목 따가움, 구내염, 잦은 감기에 시달리는 분들께 특히 효과적입니다.

스프레이 타입이 아닌 섭취형 스틱으로, 유효 성분이 위장관을 통해 전신 면역에도 기여합니다.

【 주요 특징 】
· 브라질산 그린 프로폴리스 고함량
· 합성 감미료 무첨가, 자연 꿀 향
· 어린이~성인 전 연령 섭취 가능(1일 1포)`,
  }),
  product("wsb-omega3", "WSB 트리플 오메가3", "WSB", "vitality", 26000, "혈행·기억력 케어 rTG 오메가3.", {
    reportNo: "제2026-0000000013호",
    functionality: "혈중 중성지방 개선·혈행 개선에 도움을 줄 수 있음",
    ingredients: "정제어유(EPA·DHA), 비타민E",
    description: `WSB 트리플 오메가3는 rTG(재에스테르화 트리글리세리드) 타입 오메가3로, 일반 에틸에스테르(EE) 타입 대비 흡수율이 최대 70% 높습니다.

EPA(Eicosapentaenoic acid)와 DHA(Docosahexaenoic acid) 합계 1,000 mg을 1일 2캡슐에 담아 혈중 중성지방 감소, 혈행 개선, 기억력 유지를 함께 지원합니다. 비타민E가 산화를 막아 신선도를 유지합니다.

남해 청정 해역에서 포획된 어류를 원료로 사용하며, 중금속(납·수은·카드뮴) 3중 정제 공정을 거쳤습니다.

【 권장 섭취법 】
식사와 함께 1일 2캡슐을 섭취하세요. 혈액 응고 억제제 복용 중이신 분은 의사와 상담 후 섭취를 권장합니다.`,
  }),
  product("wsb-sleep-therapy", "WSB 슬립 테라피", "WSB", "sleep", 30000, "편안한 밤을 위한 수면 케어.", {
    reportNo: "제2026-0000000014호",
    functionality: "수면의 질 개선에 도움을 줄 수 있음",
    intakeNotice: "취침 30분 전 섭취.",
    ingredients: "감태추출물, GABA, 테아닌",
    description: `WSB 슬립 테라피는 세 가지 수면 기능성 원료(감태추출물·GABA·테아닌)를 최적 비율로 배합한 수면 케어 포뮬러입니다.

감태에서 추출한 디에콜(Dieckol) 성분이 수면 유도 신경전달물질 GABA 수용체에 작용해 자연스러운 수면 진입을 돕고, GABA가 뇌 신호를 진정시켜 깊은 수면 단계(서파 수면)를 연장합니다. L-테아닌은 각성 없이 이완된 알파파 상태를 유도합니다.

【 복용 안내 】
취침 30분 전 물과 함께 1포를 섭취하세요. 비수면 의존성으로 장기 복용에도 안전합니다.

【 주의 】
운전 등 집중력이 필요한 작업 전에는 섭취를 피하세요. 임산부·수유부는 전문가와 상담 후 섭취하세요.`,
  }),
  product("wsb-probiotics", "WSB 프로바이오 데일리", "WSB", "immune", 24000, "장 건강 데일리 유산균 100억 CFU.", {
    reportNo: "제2026-0000000015호",
    functionality: "유산균 증식·유해균 억제·배변활동 원활에 도움을 줄 수 있음",
    ingredients: "프로바이오틱스 혼합 분말, 프리바이오틱스",
    description: `WSB 프로바이오 데일리는 19종 복합 유산균 100억 CFU와 프리바이오틱스(FOS)를 결합한 프리·프로바이오틱 제품입니다.

장에 유익균을 정착시키고 유해균 증식을 억제해 장내 미생물 다양성을 높입니다. 배변 주기 개선, 팽만감 감소, 전반적인 소화 편안함에 도움을 줄 수 있습니다.

위산·담즙산에 강한 마이크로캡슐 코팅 기술 적용으로 유산균이 장까지 살아서 도달합니다(장내 생존율 95% 이상, 사내 시험 기준).

【 이런 분께 추천합니다 】
· 변비·설사가 반복되는 분
· 항생제 복용 후 장 건강 회복을 원하시는 분
· 면역력 증진과 장 건강을 함께 챙기고 싶은 분

냉장 보관이 필요 없는 상온 안정형 제품입니다.`,
  }),
  product("wsb-lutein-eye", "WSB 루테인 아이케어", "WSB", "vitality", 27000, "눈 건강 루테인·지아잔틴.", {
    reportNo: "제2026-0000000016호",
    functionality: "노화로 인해 감소될 수 있는 황반색소밀도 유지에 도움을 줄 수 있음",
    ingredients: "마리골드추출물(루테인), 비타민A",
    description: `WSB 루테인 아이케어는 디지털 기기 사용으로 눈이 혹사당하는 현대인을 위한 눈 건강 전문 제품입니다.

마리골드 꽃에서 추출한 루테인(20 mg)과 지아잔틴(4 mg)이 황반색소를 보충해 블루라이트와 자외선으로부터 눈을 보호합니다. 비타민A는 야간 시력 유지와 각막 건강에 필수적인 영양소입니다.

장기간 스마트폰·컴퓨터 모니터를 사용하거나 운전 시간이 긴 분들께 특히 권장합니다.

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
    const order0001 = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(eq(schema.orders.orderNumber, "DEMO-0001"))
      .limit(1);
    if (order0001.length > 0) {
      // usedAt이 없는 NUTRO10 user_coupon만 갱신 (멱등)
      const uc = await db
        .select()
        .from(schema.userCoupons)
        .where(eq(schema.userCoupons.couponId, nutro10Rows[0].id))
        .limit(1);
      if (uc.length > 0 && !uc[0].usedAt) {
        await db
          .update(schema.userCoupons)
          .set({ usedAt: daysAgo(13), orderId: order0001[0].id })
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
  const demoUserOrders = await db
    .select({ id: schema.orders.id, orderNumber: schema.orders.orderNumber })
    .from(schema.orders)
    .where(eq(schema.orders.userId, DEMO_USER_ID));

  const orderByNo = (no: string) => demoUserOrders.find((o) => o.orderNumber === no);

  const focusProduct = products.find((p) => p.slug === "nutrogin-focus");
  const restProduct = products.find((p) => p.slug === "nutrogin-rest");
  const immuneProduct = products.find((p) => p.slug === "wsb-immune-balance");
  const propProduct = products.find((p) => p.slug === "wsb-propolis-guard");
  const luteinProduct = products.find((p) => p.slug === "wsb-lutein-eye");

  const order0001 = orderByNo("DEMO-0001");  // delivered, nutrogin-focus v:1
  const order0003 = orderByNo("DEMO-0003");  // shipped — nutrogin-rest 포함 (스키마 상 status 제약 없음)
  const order0018 = orderByNo("DEMO-0018");  // delivered, immune-balance + propolis-guard
  const order0019 = orderByNo("DEMO-0019");  // delivered, lutein-eye

  // DEMO-0001: nutrogin-focus 리뷰 (이미지 포함)
  if (order0001 && focusProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: focusProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0001.id,
        rating: 5,
        title: "집중력이 확실히 올라갔어요",
        body: "한 달째 꾸준히 먹고 있는데 오후 집중력이 눈에 띄게 좋아졌습니다. 스틱 하나씩 챙겨 다니기도 편하고, 맛도 거부감 없이 부드러워서 만족합니다. 재구매 예정입니다.",
        images: ["https://images.unsplash.com/photo-1550831107-1553da8c8464?w=600&q=80"],
      })
      .onConflictDoNothing();
  }

  // DEMO-0003: nutrogin-rest 리뷰
  if (order0003 && restProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: restProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0003.id,
        rating: 4,
        title: "수면 깊이가 달라진 느낌",
        body: "취침 30분 전에 챙겨 먹으면 몸이 확실히 이완되는 느낌이에요. 아직 한 박스 다 먹지는 않았지만 체감 효과가 있어서 만족스럽습니다. 테아닌 성분 덕분인지 다음날 아침도 개운합니다.",
        images: [],
      })
      .onConflictDoNothing();
  }

  // DEMO-0018: wsb-immune-balance 리뷰
  if (order0018 && immuneProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: immuneProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0018.id,
        rating: 4,
        title: "환절기마다 챙기는 필수템",
        body: "환절기 때마다 감기를 달고 살았는데, 3개월째 복용 중 한 번도 안 걸렸어요. 아연과 비타민C 조합이 확실히 효과가 있는 것 같습니다. 가격 대비 성분 구성도 알차고 만족합니다.",
        images: [],
      })
      .onConflictDoNothing();
  }

  // DEMO-0018: wsb-propolis-guard 리뷰 (같은 주문)
  if (order0018 && propProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: propProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0018.id,
        rating: 3,
        title: "효과는 좋은데 향이 강한 편",
        body: "프로폴리스 특유의 향이 강해서 처음엔 적응이 필요했어요. 그래도 목이 간질간질할 때 먹으면 금방 나아지는 느낌이라 계속 먹고 있습니다. 향에 민감하신 분은 주의하세요.",
        images: [],
      })
      .onConflictDoNothing();
  }

  // DEMO-0019: wsb-lutein-eye 리뷰
  if (order0019 && luteinProduct) {
    await db
      .insert(schema.reviews)
      .values({
        productId: luteinProduct.id,
        userId: DEMO_USER_ID,
        orderId: order0019.id,
        rating: 5,
        title: "눈 피로에 탁월해요",
        body: "하루 10시간 이상 모니터를 보는데, 한 달 복용 후 눈의 피로감이 눈에 띄게 줄었습니다. 루테인 함량도 충분하고 캡슐이 작아서 삼키기도 편합니다. 장기 복용 계획입니다.",
        images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
      })
      .onConflictDoNothing();
  }

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
  const targetDeliveredOrder = orderByNo("DEMO-0018");
  if (targetDeliveredOrder) {
    const existingCancellations = await db
      .select({ id: schema.orderCancellations.id })
      .from(schema.orderCancellations)
      .where(eq(schema.orderCancellations.orderId, targetDeliveredOrder.id));

    if (existingCancellations.length === 0) {
      await db.insert(schema.orderCancellations).values({
        orderId: targetDeliveredOrder.id,
        userId: DEMO_USER_ID,
        type: "return",
        reason: "상품이 기대와 달리 제 체질에 맞지 않아 반품 신청합니다. 미개봉 상태로 보관 중입니다.",
        status: "requested",
        createdAt: daysAgo(18),
      });
    }
  }

  console.log(`seed 완료: categories=${cats.length}, products=${products.length}, banners=${BANNERS.length}, orders=${ORDERS.length}, coupons=${DEMO_COUPONS.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
