export function buildOrderNumber(now: Date, rand: string): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `WSB-${y}${m}${d}-${rand.toUpperCase()}`;
}
