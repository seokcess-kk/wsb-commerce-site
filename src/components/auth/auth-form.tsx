"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signupAgreed } from "@/lib/auth/consent";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Signup-only consent state
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const canSubmit =
    mode === "login" || signupAgreed({ terms: termsAgreed, privacy: privacyAgreed });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                marketing_consent: marketingAgreed,
                terms_agreed: termsAgreed,
                privacy_agreed: privacyAgreed,
              },
            },
          });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/account");
    router.refresh();
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="email" required placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)}
        className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`} />
      <input type="password" required placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)}
        className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`} />

      {mode === "signup" && (
        <div className="space-y-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 accent-wsb-green"
              aria-label="이용약관 동의 (필수)"
            />
            <span>
              <Link href="/policy/terms" target="_blank" className="font-semibold text-wsb-green underline">이용약관</Link>에 동의합니다.{" "}
              <span className="text-rose-500 font-semibold">(필수)</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="mt-0.5 accent-wsb-green"
              aria-label="개인정보 수집·이용 동의 (필수)"
            />
            <span>
              <Link href="/policy/privacy" target="_blank" className="font-semibold text-wsb-green underline">개인정보 수집·이용</Link>에 동의합니다.{" "}
              <span className="text-rose-500 font-semibold">(필수)</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-500">
            <input
              type="checkbox"
              checked={marketingAgreed}
              onChange={(e) => setMarketingAgreed(e.target.checked)}
              className="mt-0.5 accent-wsb-green"
              aria-label="마케팅 정보 수신 동의 (선택)"
            />
            <span>마케팅 정보 수신에 동의합니다. <span className="text-stone-400">(선택)</span></span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
      <button type="submit" disabled={loading || !canSubmit}
        className={`w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 ${ring} focus-visible:ring-offset-2`}>
        {loading ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
      </button>
      <p className="text-center text-sm text-stone-500">
        {mode === "login" ? (
          <>계정이 없으신가요? <Link href="/signup" className="font-semibold text-wsb-green">회원가입</Link></>
        ) : (
          <>이미 계정이 있으신가요? <Link href="/login" className="font-semibold text-wsb-green">로그인</Link></>
        )}
      </p>
    </form>
  );
}
