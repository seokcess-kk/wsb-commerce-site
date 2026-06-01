"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string };

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ring =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2 rounded-sm";

  // Move focus to close button when drawer opens
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="메뉴 열기"
        className={`text-wsb-carbon ${ring}`}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute right-0 top-0 flex h-full w-64 flex-col gap-1 bg-wsb-lab p-5"
            aria-label="모바일 메뉴"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="메뉴 닫기"
              className={`self-end text-wsb-carbon ${ring}`}
              onClick={() => setOpen(false)}
            >
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`py-2 text-sm font-semibold text-wsb-carbon ${ring}`}
                onClick={() => setOpen(false)}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
