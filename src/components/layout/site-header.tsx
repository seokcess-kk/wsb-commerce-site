import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";

const NAV = [
  { slug: "brain-focus", label: "두뇌·집중" },
  { slug: "immune", label: "면역" },
  { slug: "sleep", label: "수면" },
  { slug: "vitality", label: "활력" },
];

const UTILS = [
  { href: "/search", label: "검색", Icon: Search },
  { href: "/account", label: "내 계정", Icon: User },
  { href: "/cart", label: "장바구니", Icon: ShoppingBag },
];

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-wsb-lab px-6 py-3.5">
      <Link href="/" className="leading-none text-lg font-extrabold tracking-tight text-wsb-green">
        WSB
        <span className="mt-0.5 block font-mono text-[9px] font-medium tracking-wide text-stone-500">
          WOORI SMART BIO
        </span>
      </Link>
      <nav className="flex gap-5 text-sm font-semibold text-wsb-carbon">
        {NAV.map((n) => (
          <Link key={n.slug} href={`/category/${n.slug}`} className="transition-colors hover:text-wsb-green">
            {n.label}
          </Link>
        ))}
        <Link href="/brand" className="transition-colors hover:text-wsb-green">브랜드</Link>
        <Link href="/support" className="transition-colors hover:text-wsb-green">고객지원</Link>
      </nav>
      <div className="flex gap-4 text-wsb-carbon">
        {UTILS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-label={label} className="transition-colors hover:text-wsb-green">
            <Icon size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        ))}
      </div>
    </header>
  );
}
