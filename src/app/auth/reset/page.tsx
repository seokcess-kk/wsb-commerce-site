"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset/confirm`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <section className="mx-auto max-w-sm px-6 py-16 text-center">
        <div className="mb-4 text-4xl">📬</div>
        <h1 className="text-xl font-extrabold text-wsb-carbon">메일을 확인해 주세요</h1>
        <p className="mt-3 text-sm text-stone-500">
          <strong>{email}</strong> 주소로 비밀번호 재설정 링크를 발송했습니다.
          <br />
          메일함을 확인해 주세요.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 text-2xl font-extrabold text-wsb-carbon">비밀번호 재설정</h1>
      <p className="mb-6 text-sm text-stone-500">
        가입 시 사용한 이메일을 입력하시면 재설정 링크를 보내드립니다.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
          aria-label="이메일"
        />
        {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 ${ring} focus-visible:ring-offset-2`}
        >
          {loading ? "처리 중…" : "재설정 링크 보내기"}
        </button>
      </form>
    </section>
  );
}
