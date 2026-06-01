"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
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
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={loading}
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
