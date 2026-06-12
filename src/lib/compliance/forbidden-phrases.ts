// 건강기능식품 표시·광고 금칙 표현 — 사용자 후기 입력·신규 카피 작성 단계에서 거른다.
// 질병명·의약품 오인·치료/즉효 단정·안전성 과장 등 심의 위반 소지 표현.
// (주의: 표준 고지 "질병의 예방 및 치료를 위한 것이 아닙니다"는 고정 문구라 사용자 입력 대상이 아니다.)
export const FORBIDDEN_PHRASES: string[] = [
  // 의약품 오인
  "수면제",
  "항생제",
  "진통제",
  "처방",
  // 질병명 단정
  "불면증",
  "우울증",
  "ADHD",
  "치매",
  "구내염",
  "고혈압",
  "당뇨병",
  // 치료·즉효 단정
  "완치",
  "특효",
  "직방",
  "즉효",
  "낫는다",
  "낫게",
  // 안전성·무위험 과장
  "부작용 없",
  "의존성이 없",
  "중독성이 없",
];

// 텍스트에 포함된 금칙 표현 목록을 반환(없으면 빈 배열).
export function findForbiddenPhrases(text: string): string[] {
  if (!text) return [];
  return FORBIDDEN_PHRASES.filter((p) => text.includes(p));
}

export function isCompliantCopy(text: string): boolean {
  return findForbiddenPhrases(text).length === 0;
}

// 입력 거부 시 사용자에게 보여줄 안내 메시지(금칙어가 없으면 null).
export function forbiddenPhraseMessage(text: string): string | null {
  const hits = findForbiddenPhrases(text);
  if (hits.length === 0) return null;
  return `사용할 수 없는 표현이 포함되어 있습니다: ${hits.join(", ")}. 질병·의약품·치료 효과를 단정하지 않는 표현으로 수정해 주세요.`;
}
