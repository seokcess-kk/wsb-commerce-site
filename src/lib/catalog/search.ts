// 검색어 정규화(순수). 앞뒤 공백 제거 + 연속 공백 1칸으로. 빈 입력은 빈 문자열.
export function normalizeSearchQuery(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ");
}

// SQL LIKE 와일드카드/이스케이프 문자를 리터럴로 처리. ilike 패턴에 감싸 쓴다.
export function toLikePattern(query: string): string {
  const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}
