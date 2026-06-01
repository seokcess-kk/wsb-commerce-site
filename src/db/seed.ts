import { config } from "dotenv";
config({ path: ".env.local" });

import { getDb, schema } from "./index";

const CATEGORIES = [
  { slug: "brain-focus", name: "두뇌·집중", sortOrder: 1 },
  { slug: "immune", name: "면역", sortOrder: 2 },
  { slug: "sleep", name: "수면", sortOrder: 3 },
  { slug: "vitality", name: "활력", sortOrder: 4 },
];

const NOTICE = "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";

async function main() {
  const db = getDb();

  await db.insert(schema.categories).values(CATEGORIES).onConflictDoNothing({ target: schema.categories.slug });

  const cats = await db.select().from(schema.categories);
  const idOf = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  const products = [
    { slug: "nutrogin-focus", name: "NUTROGIN FOCUS 브레인케어 스틱", brand: "NUTROGIN", categoryId: idOf("brain-focus"), basePrice: 39000, summary: "데이터로 키운 진세노사이드 브레인케어, 하루 한 스틱.", reviewPhraseNo: "제2026-FOCUS-001", noticeText: NOTICE, reportNo: "제2026-0000000001호", functionality: "인지능력 개선에 도움을 줄 수 있음(개별인정형 예시)", intakeNotice: "임산부·수유부·어린이는 섭취에 주의. 이상사례 발생 시 섭취 중단.", ingredients: "홍삼농축액 70%(진세노사이드 Rg1+Rb1+Rg3), 비타민 B군", images: ["/products/nutrogin-focus.png"], isPublished: true },
    { slug: "nutrogin-clear", name: "NUTROGIN CLEAR 스틱", brand: "NUTROGIN", categoryId: idOf("brain-focus"), basePrice: 39000, summary: "맑은 하루를 위한 브레인케어.", reviewPhraseNo: "제2026-CLEAR-001", noticeText: NOTICE, reportNo: "제2026-0000000002호", functionality: "피로 개선에 도움을 줄 수 있음", intakeNotice: "정해진 섭취량을 지키십시오.", ingredients: "홍삼농축액, 아연", images: ["/products/nutrogin-clear.png"], isPublished: true },
    { slug: "nutrogin-rest", name: "NUTROGIN REST 스틱", brand: "NUTROGIN", categoryId: idOf("sleep"), basePrice: 39000, summary: "깊은 휴식을 위한 나이트 케어.", reviewPhraseNo: "제2026-REST-001", noticeText: NOTICE, reportNo: "제2026-0000000003호", functionality: "수면의 질 개선에 도움을 줄 수 있음", intakeNotice: "취침 전 섭취. 운전 전 섭취 주의.", ingredients: "테아닌, 락티움", images: ["/products/nutrogin-rest.png"], isPublished: true },
    { slug: "wsb-immune-balance", name: "WSB 이뮨 밸런스", brand: "WSB", categoryId: idOf("immune"), basePrice: 28000, summary: "일상 면역 케어.", reviewPhraseNo: "제2026-IMM-001", noticeText: NOTICE, reportNo: "제2026-0000000010호", functionality: "면역력 증진에 도움을 줄 수 있음", intakeNotice: "알레르기 체질은 원료 확인.", ingredients: "아연, 비타민C, 홍삼", images: ["/products/wsb-immune.png"], isPublished: true },
    { slug: "wsb-vita-day", name: "WSB 비타 데이", brand: "WSB", categoryId: idOf("vitality"), basePrice: 22000, summary: "하루 활력 멀티비타민.", reviewPhraseNo: "제2026-VITA-001", noticeText: NOTICE, reportNo: "제2026-0000000011호", functionality: "피로 개선에 도움을 줄 수 있음", intakeNotice: "1일 1회 1포.", ingredients: "비타민 B·C·D, 미네랄", images: ["/products/wsb-vita.png"], isPublished: true },
  ];

  await db.insert(schema.products).values(products).onConflictDoNothing({ target: schema.products.slug });

  const inserted = await db.select().from(schema.products);
  const variantRows = inserted.flatMap((p) => [
    { productId: p.id, name: "1박스 (10스틱)", sku: `${p.slug}-1`, priceDelta: 0, stock: 100, sortOrder: 1 },
    { productId: p.id, name: "3박스 세트", sku: `${p.slug}-3`, priceDelta: Math.round(p.basePrice * 2.7) - p.basePrice, stock: 50, sortOrder: 2 },
  ]);
  const existingVariants = await db.select().from(schema.productVariants);
  if (existingVariants.length === 0) {
    await db.insert(schema.productVariants).values(variantRows);
  }

  console.log(`seed 완료: categories=${cats.length}, products=${inserted.length}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
