"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const RING =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2";

// 인증 상태를 클라이언트에서 조회한다. 서버 레이아웃이 쿠키를 읽지 않게 되어 페이지가 강제 동적이
// 되지 않으며(정적/ISR·프리페치 가능), 모든 페이지 서버 렌더에서 getClaims 호출이 빠진다.
// SSR/정적 초기 렌더는 비로그인 상태로 그렸다가 하이드레이션 후 실제 상태로 전환된다(짧은 깜빡임).
export function HeaderAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    // getSession(): 로컬 쿠키/스토리지에서 세션을 읽음(네트워크 없음).
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!authed) {
    return (
      <Link href="/login" aria-label="로그인" className={`text-ng-charcoal transition-colors hover:text-ng-cobalt ${RING}`}>
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/account" aria-label="마이페이지" className={`text-ng-charcoal transition-colors hover:text-ng-cobalt ${RING}`}>
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className={`text-xs font-semibold text-stone-500 hover:text-ng-cobalt ${RING}`}>
          로그아웃
        </button>
      </form>
    </div>
  );
}
