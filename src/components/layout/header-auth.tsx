import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function HeaderAuth() {
  const user = await getCurrentUser();
  const ring =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2 rounded-sm";
  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="로그인"
        className={`text-wsb-carbon transition-colors hover:text-wsb-green ${ring}`}
      >
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/account"
        aria-label="마이페이지"
        className={`text-wsb-carbon transition-colors hover:text-wsb-green ${ring}`}
      >
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className={`text-xs font-semibold text-stone-500 hover:text-wsb-green ${ring}`}
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
