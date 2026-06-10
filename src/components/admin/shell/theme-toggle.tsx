"use client";

import { useState } from "react";

// 쿠키 'admin-theme' 갱신 + 어드민 루트의 data-admin-theme 즉시 토글.
// 무플래시는 서버(admin/layout.tsx)가 쿠키로 초기값을 주입해 보장한다.
export function ThemeToggle({ initial }: { initial: "light" | "dark" }) {
  const [theme, setTheme] = useState<"light" | "dark">(initial);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `admin-theme=${next};path=/;max-age=31536000;samesite=lax`;
    const root = document.querySelector("[data-admin-theme]") as HTMLElement | null;
    if (root) root.setAttribute("data-admin-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="테마 전환"
      className="grid size-8 place-items-center rounded-lg border border-[var(--ad-line)] text-[var(--ad-mut)] hover:text-[var(--ad-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)]"
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  );
}
