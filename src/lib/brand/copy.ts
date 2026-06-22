// NUTROGIN 브랜드 카피 단일 출처.
// 슬로건·네이밍·제품 상황 카피·신뢰·루틴·후기·FAQ를 한 곳에서 관리한다.
// 모든 효능 표현은 건기식 표시·광고 기준에 맞춰 "상황·루틴 중심 / 도움을 줄 수 있음" 수준으로 유지한다.

export const BRAND = {
  name: "NUTROGIN",
  nameKo: "누트로진",
  line: "BRAINCARE",
  sloganKo: "또렷한 머리, 맑은 하루",
  sloganEn: "Sharper mind, brighter day.",
  eyebrow: "NUTROGIN BRAINCARE",
} as const;

// 기능·원료를 이름으로 증명하는 브랜드 — Nootropic + Ginsenoside.
export const NAMING = {
  parts: [
    { en: "Nootropic", ko: "두뇌 컨디션" },
    { en: "Ginsenoside", ko: "진세노사이드 원료" },
  ],
  story:
    "누트로진은 Nootropic과 Ginsenoside를 결합한 이름입니다. 약이 아니라, 바쁜 하루 속에서 가볍게 챙기는 브레인케어 루틴 — 작지만 일관된 한 스틱이 더 나은 하루의 리듬을 만듭니다.",
} as const;

export type ProductTone = "focus" | "clear" | "rest";

export const PRODUCTS: {
  code: "FOCUS" | "CLEAR" | "REST";
  ko: string;
  slug: string;
  tone: ProductTone;
  tagline: string;
  situation: string;
  keyword: string;
  timing: string;
}[] = [
  {
    code: "FOCUS",
    ko: "집중력",
    slug: "nutrogin-focus",
    tone: "focus",
    tagline: "몰입이 필요한 순간의 스위치",
    situation: "업무·공부·회의 전, 또렷하게 시작하고 싶은 순간",
    keyword: "집중",
    timing: "일과 시작 전",
  },
  {
    code: "CLEAR",
    ko: "맑은 각성",
    slug: "nutrogin-clear",
    tone: "clear",
    tagline: "맑게 비우는 한 박자",
    situation: "머리가 무겁고 흐릿한 오후, 가볍게 전환이 필요한 순간",
    keyword: "리프레시",
    timing: "나른한 오후",
  },
  {
    code: "REST",
    ko: "숙면 회복",
    slug: "nutrogin-rest",
    tone: "rest",
    tagline: "깊은 밤을 위한 마무리",
    situation: "하루를 정리하고 회복 루틴이 필요한 밤",
    keyword: "회복",
    timing: "잠들기 전",
  },
];

// 슬러그로 NUTROGIN 제품 메타(코드·톤·상황 카피)를 조회. 없으면 null.
export function nutroginMeta(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export const NUTROGIN_SLUGS = PRODUCTS.map((p) => p.slug);

// NUTROGIN 3종 제품 사진(public/product/). box=외박스(대표 썸네일), stick=내품 스틱.
// 파일명 규약: package_<slug_underscored>.png / product_<slug_underscored>.png
//   예) nutrogin-focus → /product/package_nutrogin_focus.png · /product/product_nutrogin_focus.png
// 이미지·DB·컴포넌트가 공유하는 단일 출처. WSB 등 비-NUTROGIN 슬러그는 null/[].
export function nutroginAsset(slug: string): { box: string; stick: string } | null {
  if (!NUTROGIN_SLUGS.includes(slug)) return null;
  const key = slug.replace(/-/g, "_");
  return { box: `/product/package_${key}.png`, stick: `/product/product_${key}.png` };
}

// 갤러리/카드용 이미지 배열 — [외박스, 내품] 순서(외박스가 images[0]=대표 썸네일).
export function nutroginImages(slug: string): string[] {
  const a = nutroginAsset(slug);
  return a ? [a.box, a.stick] : [];
}

// 제품 상세 구매 정보 — 구성·섭취·보관·권장대상(건기식 기준 준수, 상황·루틴 중심).
export const PRODUCT_DETAILS: Record<
  string,
  { composition: string; intake: string; storage: string; audience: string }
> = {
  "nutrogin-focus": {
    composition: "10 sticks × 2g (총 20g)",
    intake: "1일 1스틱, 집중이 필요한 일과 시작 전 물 없이 그대로 섭취하세요.",
    storage: "직사광선을 피해 서늘하고 건조한 곳에 보관하세요.",
    audience: "업무·학습 등 집중이 필요한 성인. 임산부·수유부, 질환이 있거나 약을 복용 중이면 전문가와 상담 후 드세요.",
  },
  "nutrogin-clear": {
    composition: "10 sticks × 2g (총 20g)",
    intake: "1일 1스틱, 머리가 무거운 오후에 물 없이 그대로 섭취하세요.",
    storage: "직사광선을 피해 서늘하고 건조한 곳에 보관하세요.",
    audience: "맑은 컨디션 전환이 필요한 성인. 임산부·수유부, 질환이 있거나 약을 복용 중이면 전문가와 상담 후 드세요.",
  },
  "nutrogin-rest": {
    composition: "10 sticks × 2g (총 20g)",
    intake: "1일 1스틱, 잠들기 전 하루를 정리하며 물 없이 그대로 섭취하세요.",
    storage: "직사광선을 피해 서늘하고 건조한 곳에 보관하세요.",
    audience: "하루의 마무리 루틴이 필요한 성인. 임산부·수유부, 질환이 있거나 약을 복용 중이면 전문가와 상담 후 드세요.",
  },
};

export function productDetail(slug: string) {
  return PRODUCT_DETAILS[slug] ?? null;
}

// 연관 추천 슬러그 — NUTROGIN 3종 교차추천(현재 상품 제외).
export function relatedNutroginSlugs(currentSlug: string): string[] {
  return NUTROGIN_SLUGS.filter((s) => s !== currentSlug);
}

// 상황별 추천 — 사용자가 자기 상황에서 제품을 고르도록.
export const SITUATIONS: { label: string; persona: string; slug: string; code: string }[] = [
  { label: "회의와 의사결정이 많은 날", persona: "직장인", slug: "nutrogin-focus", code: "FOCUS" },
  { label: "장시간 몰입이 필요한 작업", persona: "개발자·기획자", slug: "nutrogin-focus", code: "FOCUS" },
  { label: "머리가 무거운 오후의 전환", persona: "오후 슬럼프", slug: "nutrogin-clear", code: "CLEAR" },
  { label: "시험·자격증을 준비하는 시간", persona: "수험생·학습자", slug: "nutrogin-clear", code: "CLEAR" },
  { label: "퇴근 후 하루를 정리하는 밤", persona: "회복이 필요한 사람", slug: "nutrogin-rest", code: "REST" },
];

// 브랜드 신뢰 3축 — 기술·원료·형태.
export const TRUST_PILLARS: { key: string; title: string; body: string }[] = [
  {
    key: "smartfarm",
    title: "스마트팜 표준화 원료",
    body: "스마트팜에서 재배·관리한 식물 원료를 표준화해 사용합니다. 환경에 흔들리지 않는 일관된 품질이 출발점입니다.",
  },
  {
    key: "ginsenoside",
    title: "진세노사이드 기반 설계",
    body: "지표성분인 진세노사이드를 정량 관리합니다. 기능과 원료를 이름으로 증명하는 NUTROGIN의 방식입니다.",
  },
  {
    key: "stick",
    title: "하루 한 스틱, 휴대 간편",
    body: "물 없이 입에 털어 넣는 스틱형 젤리. 가방에, 책상 위에 — 가볍게 챙기는 데일리 루틴에 맞췄습니다.",
  },
];

// 루틴 제안 — 하루의 리듬.
export const ROUTINE: { time: string; title: string; body: string; code: string; tone: ProductTone }[] = [
  { time: "09:00", title: "또렷한 시작", body: "업무·공부를 시작하기 전, 집중이 필요한 순간을 위한 한 스틱.", code: "FOCUS", tone: "focus" },
  { time: "15:00", title: "가볍게 리프레시", body: "머리가 무거워지는 오후, 맑은 전환이 필요할 때.", code: "CLEAR", tone: "clear" },
  { time: "23:00", title: "하루를 정리", body: "잠들기 전, 하루를 마무리하는 회복 루틴으로.", code: "REST", tone: "rest" },
];

// 베타 테스터 후기 — 사용 경험·맛·편의 중심(효능 단정 금지). 개인 경험 면책 표기와 함께 노출.
export const REVIEWS: { quote: string; author: string; role: string }[] = [
  { quote: "스틱이라 가방에 넣고 다니기 편해요. 맛이 부담 없어서 매일 자연스럽게 챙기게 됩니다.", author: "P님", role: "개발자 · 베타 테스터" },
  { quote: "회의 많은 날 아침 루틴으로 자리 잡았어요. 물 없이 먹는 게 생각보다 간편합니다.", author: "K님", role: "기획자 · 베타 테스터" },
  { quote: "밤에 하루를 정리하는 느낌으로 가볍게 챙겨요. 맛이 깔끔해서 좋았습니다.", author: "L님", role: "수험생 학부모 · 베타 테스터" },
];

export const REVIEW_DISCLAIMER = "개인의 사용 경험이며 제품의 기능성이나 효과를 보장하지 않습니다.";

// 자주 묻는 질문 — 섭취/타이밍/배송/교환반품/보관/대상.
export const FAQ: { q: string; a: string }[] = [
  {
    q: "어떻게 먹나요?",
    a: "1일 1스틱, 물 없이 입에 털어 넣어 드세요. 제품별 권장 섭취 시점은 상세페이지를 참고해 주세요.",
  },
  {
    q: "언제 먹는 게 좋아요?",
    a: "FOCUS는 집중이 필요한 일과 전, CLEAR는 나른한 오후, REST는 잠들기 전 루틴을 권장합니다.",
  },
  {
    q: "배송은 얼마나 걸리나요?",
    a: "평일 영업시간 내 결제 시 보통 1~3일 내 도착합니다. 5만원 이상 구매 시 무료배송입니다.",
  },
  {
    q: "교환·반품이 되나요?",
    a: "미개봉 상품은 수령 후 7일 이내 교환·반품이 가능합니다. 식품 특성상 개봉 후 단순변심 반품은 제한될 수 있습니다.",
  },
  {
    q: "보관은 어떻게 하나요?",
    a: "직사광선을 피해 서늘하고 건조한 곳에 보관해 주세요.",
  },
  {
    q: "누가 먹으면 좋나요?",
    a: "집중과 컨디션 관리가 필요한 성인을 위한 제품입니다. 임산부·수유부, 질환이 있거나 약을 복용 중인 경우 전문가와 상담 후 드세요.",
  },
];

// 비-NUTROGIN(WSB) 상품용 공통 FAQ — 제형 중립. 스틱/FOCUS·CLEAR·REST 타이밍 등
// NUTROGIN 전용 안내를 제외하고, 섭취법은 각 상품의 표시사항을 따르도록 안내한다(섭취법 오안내 방지).
export const GENERIC_FAQ: { q: string; a: string }[] = [
  {
    q: "어떻게 먹나요?",
    a: "제품별 권장 섭취량·섭취 방법은 상세페이지의 '제품 정보'와 제품 표시사항을 확인해 주세요.",
  },
  {
    q: "배송은 얼마나 걸리나요?",
    a: "평일 영업시간 내 결제 시 보통 1~3일 내 도착합니다. 5만원 이상 구매 시 무료배송입니다.",
  },
  {
    q: "교환·반품이 되나요?",
    a: "미개봉 상품은 수령 후 7일 이내 교환·반품이 가능합니다. 식품 특성상 개봉 후 단순변심 반품은 제한될 수 있습니다.",
  },
  {
    q: "보관은 어떻게 하나요?",
    a: "직사광선을 피해 서늘하고 건조한 곳에 보관해 주세요.",
  },
  {
    q: "누가 먹으면 좋나요?",
    a: "건강관리가 필요한 성인을 위한 제품입니다. 임산부·수유부, 질환이 있거나 약을 복용 중인 경우 전문가와 상담 후 드세요.",
  },
];

export const HEALTH_DISCLAIMER = "본 제품은 건강기능식품이며, 질병의 예방·치료를 위한 의약품이 아닙니다.";
