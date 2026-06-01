export const MAX_QUANTITY = 99;

// 유효한 1..MAX_QUANTITY 정수만 통과, 그 외(NaN/음수/0/초과/비정수)는 null
export function parseQuantity(input: unknown): number | null {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return null;
  const q = Math.floor(n);
  if (q < 1 || q > MAX_QUANTITY) return null;
  return q;
}
