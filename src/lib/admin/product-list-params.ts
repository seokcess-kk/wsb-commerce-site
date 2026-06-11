// 어드민 상품 목록 쿼리스트링 정규화 — 순수 함수(UI/DB 비의존).

// 노출 필터 탭(view) → isPublished 조건. 미지정/미지값은 전체(undefined).
export function publishedFromView(view: string | undefined): boolean | undefined {
  if (view === "visible") return true;
  if (view === "hidden") return false;
  return undefined;
}

// page 쿼리값 → 1 이상 정수. 비숫자/하한 미만은 1.
export function clampPage(raw: string | number | undefined): number {
  const n = Number(raw ?? 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

// 총 건수 → 페이지 수(최소 1).
export function productTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
