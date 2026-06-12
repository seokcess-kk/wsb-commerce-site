import Link from "next/link";

const RING = "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2";

const SHOP = [
  { href: "/products", label: "라인업" },
  { href: "/brand", label: "브랜드 스토리" },
  { href: "/support", label: "고객지원" },
  { href: "/order-lookup", label: "비회원 주문조회" },
];

const CATEGORY = [
  { href: "/category/brain-focus", label: "두뇌·집중" },
  { href: "/category/immune", label: "면역" },
  { href: "/category/sleep", label: "수면" },
  { href: "/category/vitality", label: "활력" },
];

export function SiteFooter() {
  return (
    <footer className="bg-ng-charcoal text-stone-400">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white">
              NUTROGIN <span className="text-ng-neon">BRAINCARE</span>
            </p>
            <p className="mt-2 text-xs text-stone-500">또렷한 머리, 맑은 하루.</p>
          </div>

          <nav className="text-xs leading-7" aria-label="쇼핑">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Shop</p>
            {SHOP.map((l) => (
              <Link key={l.href} href={l.href} className={`block transition-colors hover:text-white ${RING}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <nav className="text-xs leading-7" aria-label="카테고리">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Category</p>
            {CATEGORY.map((l) => (
              <Link key={l.href} href={l.href} className={`block transition-colors hover:text-white ${RING}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-[11px] leading-6">
          <p>
            <strong className="text-stone-200">(주)우리스마트바이오</strong> · 대표 ○○○ · 사업자등록번호 000-00-00000 ·
            통신판매업 0000-서울-0000
          </p>
          <p className="mt-1">
            <Link href="/policy/privacy" className={RING}>
              개인정보처리방침
            </Link>{" "}
            ·{" "}
            <Link href="/policy/terms" className={RING}>
              이용약관
            </Link>{" "}
            ·{" "}
            <Link href="/policy/shipping" className={RING}>
              배송/교환/환불 안내
            </Link>
          </p>
          <p className="mt-2">
            <strong className="text-stone-200">본 제품은 질병의 예방·치료를 위한 것이 아닙니다.</strong> · 건강기능식품 표시·광고 심의필
          </p>
        </div>
      </div>
    </footer>
  );
}
