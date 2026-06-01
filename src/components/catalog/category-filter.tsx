import Link from "next/link";

type Cat = { slug: string; name: string };

export function CategoryFilter({ categories, activeSlug }: { categories: Cat[]; activeSlug: string | null }) {
  const base = "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";
  const on = "bg-wsb-green text-white border-wsb-green";
  const off = "border-wsb-green text-wsb-green hover:bg-wsb-green/5";
  return (
    <nav className="flex flex-wrap gap-2" aria-label="효능별 카테고리">
      <Link href="/products" className={`${base} ${activeSlug === null ? on : off}`}
        aria-current={activeSlug === null ? "page" : undefined}>
        전체
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={`/category/${c.slug}`} className={`${base} ${activeSlug === c.slug ? on : off}`}
          aria-current={activeSlug === c.slug ? "page" : undefined}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
