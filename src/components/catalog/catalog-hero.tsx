// 카탈로그 상단 코발트 브랜드 밴드 — 리스트/카테고리/검색 공유. h1 역할.
export function CatalogHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b-2 border-ng-neon bg-ng-cobalt px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-ng-neon">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{description}</p>}
      </div>
    </section>
  );
}
