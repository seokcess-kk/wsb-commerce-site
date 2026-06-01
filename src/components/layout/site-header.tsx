import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { CartBadge } from "@/components/cart/cart-badge";

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
      <Link
        href="/"
        className="leading-none text-lg font-extrabold tracking-tight text-wsb-green rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
      >
        WSB
        <span className="mt-0.5 block font-mono text-[9px] font-medium tracking-wide text-stone-500">
          WOORI SMART BIO
        </span>
      </Link>
      <nav className="hidden md:flex gap-5 text-sm font-semibold text-wsb-carbon">
        {NAV.map((n) => (
          <Link
            key={n.slug}
            href={`/category/${n.slug}`}
            className="transition-colors hover:text-wsb-green rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
          >
            {n.label}
          </Link>
        ))}
        <Link
          href="/brand"
          className="transition-colors hover:text-wsb-green rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
        >
          브랜드
        </Link>
        <Link
          href="/support"
          className="transition-colors hover:text-wsb-green rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
        >
          고객지원
        </Link>
      </nav>
      <div className="flex gap-4 text-wsb-carbon">
        <MobileNav
          items={[
            ...NAV.map((n) => ({ href: `/category/${n.slug}`, label: n.label })),
            { href: "/brand", label: "브랜드" },
            { href: "/support", label: "고객지원" },
          ]}
        />
        {UTILS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="relative flex items-center transition-colors hover:text-wsb-green rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden />
            {href === "/cart" && <CartBadge />}
          </Link>
        ))}
      </div>
    </header>
  );
}
