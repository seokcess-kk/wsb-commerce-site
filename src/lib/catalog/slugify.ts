// 상품명/카테고리명 → URL slug 자동 생성.
// 현 코드베이스의 slug는 전부 영문(nutrogin-focus, wsb-immune-balance)이라 영문/숫자만 채택하고
// 한글 등 비ASCII는 제거한다. 자동 제안값은 운영자가 폼에서 수정할 수 있으므로 best-effort 다.
// 한글만으로 이뤄진 이름이면 빈 결과가 되어 fallback("item")을 반환 — 운영자가 영문 slug 로 다듬는다.
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD") // 분음부호 분리(é → e + ´ 후 제거)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // 영문 소문자/숫자/공백/하이픈만 남김
    .trim()
    .replace(/[\s-]+/g, "-") // 공백·연속 하이픈 → 단일 하이픈
    .replace(/^-+|-+$/g, ""); // 양끝 하이픈 제거
  return base || "item";
}

// 기존 slug 집합(taken)과 충돌하면 -2, -3 … 접미사로 유일하게 만든다.
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
