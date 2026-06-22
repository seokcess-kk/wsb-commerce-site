import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/lib/cart/cart-context";
import { NotFoundContent } from "@/components/ui/not-found-content";

// 매칭되지 않는 최상위 URL — 루트 레이아웃에는 헤더/푸터가 없으므로 직접 사이트 크롬을 렌더한다.
// (CartBadge 가 useCart 를 쓰므로 CartProvider 로 감싼다 — 스토어프론트 레이아웃과 동일 구성.)
export default function NotFound() {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <NotFoundContent />
        </main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
