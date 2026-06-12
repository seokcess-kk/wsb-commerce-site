import Link from "next/link";
import { Search, ShoppingBag, Heart } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { CartBadge } from "@/components/cart/cart-badge";
import { HeaderAuth } from "./header-auth";

// NUTROGIN 자사몰 쉘 — 오프화이트 베이스 + 코발트 액티브. GNB는 라인업·3종·브랜드·고객지원 중심.
const NAV = [
  { href: "/products", label: "라인업" },
  { href: "/products/nutrogin-focus", label: "집중" },
  { href: "/products/nutrogin-clear", label: "각성" },
  { href: "/products/nutrogin-rest", label: "숙면" },
  { href: "/brand", label: "브랜드" },
  { href: "/support", label: "고객지원" },
];

const RING = "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3.5">
      <Link href="/" className={`leading-none ${RING}`} aria-label="NUTROGIN 홈">
        <span className="block text-lg font-extrabold tracking-tight text-ng-cobalt">NUTROGIN</span>
        <span className="mt-0.5 block font-mono text-[9px] font-medium tracking-[0.2em] text-stone-400">BRAINCARE</span>
      </Link>

      <nav className="hidden gap-5 text-sm font-semibold text-ng-charcoal md:flex">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`transition-colors hover:text-ng-cobalt ${RING}`}>
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4 text-ng-charcoal">
        <MobileNav items={[...NAV, { href: "/order-lookup", label: "비회원 주문조회" }]} />
        <Link href="/search" aria-label="검색" className={`relative flex items-center transition-colors hover:text-ng-cobalt ${RING}`}>
          <Search size={20} strokeWidth={1.75} aria-hidden />
        </Link>
        <HeaderAuth />
        <Link
          href="/account/wishlist"
          aria-label="찜 목록"
          className={`relative flex items-center transition-colors hover:text-ng-cobalt ${RING}`}
        >
          <Heart size={20} strokeWidth={1.75} aria-hidden />
        </Link>
        <Link
          href="/cart"
          aria-label="장바구니"
          className={`relative flex items-center transition-colors hover:text-ng-cobalt ${RING}`}
        >
          <ShoppingBag size={20} strokeWidth={1.75} aria-hidden />
          <CartBadge />
        </Link>
      </div>
    </header>
  );
}
