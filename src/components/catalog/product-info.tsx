// 제품 정보 — 구매 판단에 필요한 핵심 사실을 묻지 않고 바로 보여준다(숨기지 않음).
// 구성·섭취·보관·권장대상은 NUTROGIN 큐레이션(copy.ts), 원료·기능성은 DB 값.
export function ProductInfo({
  composition,
  intake,
  storage,
  audience,
  ingredients,
  functionality,
}: {
  composition?: string | null;
  intake?: string | null;
  storage?: string | null;
  audience?: string | null;
  ingredients?: string | null;
  functionality?: string | null;
}) {
  const rows: { label: string; value: string; mono?: boolean }[] = [];
  if (composition) rows.push({ label: "구성", value: composition, mono: true });
  if (intake) rows.push({ label: "섭취 방법", value: intake });
  if (functionality) rows.push({ label: "기능성", value: functionality });
  if (ingredients) rows.push({ label: "원료 및 함량", value: ingredients, mono: true });
  if (storage) rows.push({ label: "보관 방법", value: storage });
  if (audience) rows.push({ label: "권장 대상", value: audience });

  if (rows.length === 0) return null;

  return (
    <dl className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-4 px-5 py-4">
          <dt className="w-24 shrink-0 font-bold text-ng-charcoal">{r.label}</dt>
          <dd className={`flex-1 leading-relaxed text-stone-600 ${r.mono ? "font-mono text-xs" : ""}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
