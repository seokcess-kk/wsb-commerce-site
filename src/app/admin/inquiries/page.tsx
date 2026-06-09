import Link from "next/link";
import { listInquiries } from "@/db/queries/admin-inquiries";
import { formatDate } from "@/lib/format";
import { answerInquiry } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "open", label: "미답변" },
  { value: "answered", label: "답변완료" },
] as const;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const inquiries = await listInquiries(status || undefined);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">문의관리</h1>
      <p className="mt-1 text-sm text-stone-500">답변 저장 시 상태가 답변완료로 바뀝니다(이메일 발송은 별도).</p>

      <nav className="mt-4 flex gap-1 text-sm">
        {FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/inquiries?status=${f.value}` : "/admin/inquiries"}
              className={
                active
                  ? "rounded-md bg-wsb-green px-3 py-1.5 font-semibold text-white"
                  : "rounded-md px-3 py-1.5 font-semibold text-stone-500 hover:bg-stone-100"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <ul className="mt-4 space-y-3">
        {inquiries.map((q) => (
          <li key={q.id} className="rounded-lg border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] text-stone-500">
                    {q.category}
                  </span>
                  <span className="font-semibold text-wsb-carbon">{q.subject}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {q.email} · {formatDate(q.createdAt)}
                </p>
              </div>
              <span
                className={
                  q.status === "answered"
                    ? "shrink-0 text-xs font-semibold text-wsb-green"
                    : "shrink-0 text-xs font-semibold text-amber-600"
                }
              >
                {q.status === "answered" ? "답변완료" : "미답변"}
              </span>
            </div>

            <p className="mt-3 whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm text-stone-700">
              {q.body}
            </p>

            <form action={answerInquiry} className="mt-3">
              <input type="hidden" name="id" value={q.id} />
              <textarea
                name="answer"
                required
                defaultValue={q.answer ?? ""}
                rows={3}
                placeholder="답변을 입력하세요"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
              />
              <button
                type="submit"
                className="mt-2 rounded-md bg-wsb-green px-4 py-2 text-sm font-bold text-white hover:bg-wsb-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
              >
                {q.status === "answered" ? "답변 수정" : "답변 등록"}
              </button>
            </form>
          </li>
        ))}
      </ul>
      {inquiries.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-400">문의가 없습니다.</p>
      )}
    </div>
  );
}
