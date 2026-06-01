"use client";
import { createClient } from "@/lib/supabase/client";

const PROVIDERS = [
  { id: "kakao" as const, label: "카카오로 시작하기", cls: "bg-[#FEE500] text-[#191600]" },
  { id: "google" as const, label: "Google로 시작하기", cls: "border border-stone-300 text-stone-700" },
];

export function SocialButtons() {
  async function signIn(provider: "kakao" | "google") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <button key={p.id} type="button" onClick={() => signIn(p.id)}
          className={`w-full rounded-md py-3 text-sm font-bold ${p.cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2`}>
          {p.label}
        </button>
      ))}
      <p className="text-center text-[11px] text-stone-400">소셜 로그인은 Supabase 대시보드에 provider 등록 후 작동합니다.</p>
    </div>
  );
}
