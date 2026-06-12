import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function HeaderAuth() {
  const user = await getCurrentUser();
  const ring =
    "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2";
  if (!user) {
    return (
      <Link href="/login" aria-label="로그인" className={`text-ng-charcoal transition-colors hover:text-ng-cobalt ${ring}`}>
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/account" aria-label="마이페이지" className={`text-ng-charcoal transition-colors hover:text-ng-cobalt ${ring}`}>
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className={`text-xs font-semibold text-stone-500 hover:text-ng-cobalt ${ring}`}>
          로그아웃
        </button>
      </form>
    </div>
  );
}
