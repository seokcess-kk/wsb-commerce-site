"use client";

import { useState, useTransition } from "react";
import { submitInquiry } from "./actions";

const CATEGORIES = ["배송", "주문", "상품", "기타"] as const;

export function InquiryForm({
  initialEmail,
  isLoggedIn,
}: {
  initialEmail: string;
  isLoggedIn: boolean;
}) {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("category", category);
    fd.append("subject", subject);
    fd.append("body", body);
    fd.append("email", email);
    startTransition(async () => {
      const result = await submitInquiry(fd);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="inq-email" className="mb-1 block text-sm font-semibold text-wsb-carbon">
          이메일
        </label>
        <input
          id="inq-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={isLoggedIn}
          placeholder="이메일"
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${
            isLoggedIn ? "bg-stone-100 text-stone-500 cursor-not-allowed" : ""
          } ${ring}`}
          aria-label="이메일"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="inq-category" className="mb-1 block text-sm font-semibold text-wsb-carbon">
          문의 유형
        </label>
        <select
          id="inq-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
          aria-label="문의 유형"
        >
          <option value="">유형을 선택해 주세요</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="inq-subject" className="mb-1 block text-sm font-semibold text-wsb-carbon">
          제목
        </label>
        <input
          id="inq-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="제목을 입력해 주세요"
          className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
          aria-label="제목"
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="inq-body" className="mb-1 block text-sm font-semibold text-wsb-carbon">
          문의 내용
        </label>
        <textarea
          id="inq-body"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="문의 내용을 입력해 주세요"
          rows={6}
          className={`w-full resize-none rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`}
          aria-label="문의 내용"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 ${ring} focus-visible:ring-offset-2`}
      >
        {isPending ? "처리 중…" : "문의 접수"}
      </button>
    </form>
  );
}
