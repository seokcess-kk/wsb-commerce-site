import Link from "next/link";

type PricePreset = {
  readonly label: string;
  readonly min: number | undefined;
  readonly max: number | undefined;
};

function presetKey(p: PricePreset) {
  return `${p.min ?? ""}-${p.max ?? ""}`;
}

export function PriceFilter({
  presets,
  activePreset,
  basePath = "",
  currentSort,
}: {
  presets: readonly PricePreset[];
  activePreset?: string;
  basePath?: string;
  currentSort?: string;
}) {
  const base =
    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";
  const on = "bg-wsb-green text-white border-wsb-green";
  const off = "border-wsb-green text-wsb-green hover:bg-wsb-green/5";

  const sortSuffix =
    currentSort && currentSort !== "newest" ? `&sort=${currentSort}` : "";
  const root = basePath || "/products";

  return (
    <nav className="flex flex-wrap gap-2" aria-label="가격 필터">
      {presets.map((p) => {
        const key = presetKey(p);
        const isAll = p.min === undefined && p.max === undefined;
        const isActive = isAll ? !activePreset : activePreset === key;
        const hrefBase = isAll
          ? `${root}${sortSuffix ? `?sort=${currentSort}` : ""}`
          : `${root}?price=${key}${sortSuffix}`;
        return (
          <Link
            key={key}
            href={hrefBase}
            className={`${base} ${isActive ? on : off}`}
            aria-current={isActive ? "page" : undefined}
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
