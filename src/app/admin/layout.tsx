import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "상품관리" },
  { href: "/admin/orders", label: "주문관리" },
  { href: "/admin/banners", label: "배너관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-6 py-8">
      <aside className="w-44 shrink-0">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-stone-400">WSB Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 font-semibold text-wsb-carbon hover:bg-wsb-green/5 hover:text-wsb-green">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
