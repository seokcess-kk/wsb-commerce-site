import { AdminNav } from "./admin-nav";
import { ThemeToggle } from "./theme-toggle";

const ICON = {
  dash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  product: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>,
  order: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  refund: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 5v4h4"/></svg>,
  coupon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>,
  inquiry: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  review: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 7 .5-5 4.5 1.5 7-6.5-4-6.5 4 1.5-7-5-4.5 7-.5z"/></svg>,
  banner: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg>,
};

export function AdminShell({
  theme,
  badges,
  crumb,
  children,
}: {
  theme: "light" | "dark";
  badges: { inquiries: number; cancellations: number };
  crumb: string;
  children: React.ReactNode;
}) {
  const groups = [
    { title: "OVERVIEW", items: [{ href: "/admin", label: "대시보드", icon: ICON.dash }] },
    {
      title: "COMMERCE",
      items: [
        { href: "/admin/products", label: "상품관리", icon: ICON.product },
        { href: "/admin/orders", label: "주문관리", icon: ICON.order },
        { href: "/admin/orders/cancellations", label: "취소/반품", icon: ICON.refund, badge: badges.cancellations || undefined },
        { href: "/admin/coupons", label: "쿠폰관리", icon: ICON.coupon },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { href: "/admin/inquiries", label: "문의관리", icon: ICON.inquiry, badge: badges.inquiries || undefined },
        { href: "/admin/reviews", label: "리뷰관리", icon: ICON.review },
        { href: "/admin/banners", label: "배너관리", icon: ICON.banner },
      ],
    },
  ];

  return (
    <div data-admin-theme={theme} className="min-h-screen bg-[var(--ad-bg)] text-[var(--ad-ink)]">
      <div className="grid grid-cols-[236px_1fr]">
        <aside className="min-h-screen bg-[var(--ad-sidebar)] px-4 py-5">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--ad-accent)] to-[var(--ad-accent-2)] font-mono text-sm font-extrabold text-white">W</div>
            <div>
              <p className="text-sm font-extrabold leading-none text-white">WSB</p>
              <p className="font-mono text-[9.5px] tracking-[0.3em] text-[var(--ad-sidebar-ink)]">OPS CONSOLE</p>
            </div>
          </div>
          <AdminNav groups={groups} />
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-[var(--ad-line)] bg-[var(--ad-panel)] px-7 py-4">
            <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--ad-mut)]">
              WSB / <span className="text-[var(--ad-ink)]">{crumb}</span>
            </p>
            <div className="flex items-center gap-3">
              <ThemeToggle initial={theme} />
              <div className="grid size-8 place-items-center rounded-full bg-[var(--ad-line-2)] font-mono text-xs font-bold text-[var(--ad-accent)]">A</div>
            </div>
          </header>
          <div className="px-7 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
