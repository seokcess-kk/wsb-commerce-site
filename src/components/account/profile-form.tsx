"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordChange } from "@/lib/account/password";

export function ProfileForm({ email }: { email: string | null }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const err = validatePasswordChange(pw, confirm);
    if (err) return setMsg({ ok: false, text: err });
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setPw("");
    setConfirm("");
    setMsg({ ok: true, text: "비밀번호가 변경되었습니다." });
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";
  return (
    <div className="mt-6 space-y-8">
      <div>
        <label className="block text-sm font-semibold text-wsb-carbon">이메일</label>
        <input
          type="email"
          value={email ?? ""}
          readOnly
          disabled
          className="mt-1 w-full cursor-not-allowed rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500"
        />
        <p className="mt-1 text-xs text-stone-400">이메일 변경은 고객센터로 문의해 주세요.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-sm font-semibold text-wsb-carbon">비밀번호 변경</h2>
        <input
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
        />
        {msg && <p className={`text-sm ${msg.ok ? "text-wsb-green" : "text-rose-600"}`}>{msg.text}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`rounded-md bg-wsb-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${ring} focus-visible:ring-offset-2`}
        >
          {loading ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
