"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode; badge?: number };
type Group = { title: string; items: Item[] };

export function AdminNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--ad-sidebar-ink)]/60">
            {g.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const on = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition " +
                    (on
                      ? "bg-white text-[var(--ad-accent)]"
                      : "text-[var(--ad-sidebar-ink)] hover:bg-white/5 hover:text-white")
                  }
                >
                  <span className="size-4 opacity-90">{it.icon}</span>
                  {it.label}
                  {it.badge ? (
                    <span className="ml-auto rounded-md bg-[var(--ad-neon)] px-1.5 py-px font-mono text-[10px] font-bold text-[#2a2d00]">
                      {it.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
