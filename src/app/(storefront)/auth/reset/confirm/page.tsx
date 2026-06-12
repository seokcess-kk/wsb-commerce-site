"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateNewPassword } from "@/lib/auth/password";

export default function ResetConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateNewPassword(password, confirm);
    if (!validation.ok) {
      setError(validation.reason);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/login?message=" + encodeURIComponent("비밀번호가 변경되었습니다. 다시 로그인해 주세요."));
  }

  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 text-2xl font-extrabold text-ng-charcoal">새 비밀번호 설정</h1>
      <p className="mb-6 text-sm text-stone-500">새로 사용할 비밀번호를 입력해 주세요.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          required
          placeholder="새 비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
          aria-label="새 비밀번호"
        />
        <input
          type="password"
          required
          placeholder="새 비밀번호 확인"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
          aria-label="새 비밀번호 확인"
        />
        {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-md bg-ng-cobalt py-3 text-sm font-bold text-white disabled:opacity-40 ${ring} focus-visible:ring-offset-2`}
        >
          {loading ? "처리 중…" : "비밀번호 변경"}
        </button>
      </form>
    </section>
  );
}
